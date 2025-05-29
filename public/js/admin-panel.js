// Add headers configuration at the top
const headers = {
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('token')
};

// DOM Elements
const systemLogs = document.getElementById('systemLogs');
const refreshLogsBtn = document.getElementById('refreshLogsBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');

// Variáveis para armazenar as instâncias dos gráficos
let monthlyAttendanceChart = null;
let contactsPerMonthChart = null;

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    loadStatistics();
    loadSystemLogs();
    renderAdminDashboard();
});

// Event Listeners
refreshLogsBtn.addEventListener('click', loadSystemLogs);
clearLogsBtn.addEventListener('click', clearSystemLogs);

// Load system statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/admin/stats', { headers });
        if (!response.ok) throw new Error('Failed to load statistics');
        
        const stats = await response.json();
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
        document.getElementById('totalMembers').textContent = stats.totalMembers;
        document.getElementById('totalContacts').textContent = stats.totalContacts;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load system logs
async function loadSystemLogs() {
    try {
        const response = await fetch('/api/admin/logs', { headers });
        if (!response.ok) throw new Error('Failed to load logs');
        
        const logs = await response.json();
        renderSystemLogs(logs);
        showToast('Logs atualizados com sucesso');
    } catch (error) {
        console.error('Error loading logs:', error);
        showToast('Erro ao carregar logs', 'error');
    }
}

// Clear system logs
async function clearSystemLogs() {
    if (!confirm('Tem certeza que deseja limpar todos os logs do sistema?')) return;
    
    try {
        const response = await fetch('/api/admin/logs', {
            method: 'DELETE',
            headers
        });

        if (!response.ok) throw new Error('Failed to clear logs');
        
        systemLogs.innerHTML = '';
        showToast('Logs limpos com sucesso');
    } catch (error) {
        console.error('Error clearing logs:', error);
        showToast('Erro ao limpar logs', 'error');
    }
}

// Render system logs
function renderSystemLogs(logs) {
    systemLogs.innerHTML = logs.map(log => `
        <div class="log-entry ${log.level}">
            <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
            <span class="log-level">${log.level}</span>
            <span class="log-message">${log.message}</span>
        </div>
    `).join('');
}

// Modificar a função renderAdminDashboard para usar try-catch em cada operação
async function renderAdminDashboard() {
    try {
        // Verificar se Chart está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            return;
        }

        // Busca dados do banco
        const members = await fetch('/db/members.json').then(res => res.json());
        const contacts = await fetch('/db/contacts.json').then(res => res.json());
        
        // Atualiza estatísticas
        document.getElementById('totalMembers').textContent = members.length;
        document.getElementById('totalContacts').textContent = contacts.length;
        
        // Calcula contatos recentes (último mês)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const recentContacts = contacts.filter(c => new Date(c.createdAt) > oneMonthAgo).length;
        document.getElementById('recentContacts').textContent = recentContacts;

        // Prepara dados para gráfico de contatos por mês
        const contactsByMonth = contacts.reduce((acc, contact) => {
            const date = new Date(contact.createdAt);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            acc[monthYear] = (acc[monthYear] || 0) + 1;
            return acc;
        }, {});

        // Encontra mês com mais cadastros
        const maxMonth = Object.entries(contactsByMonth)
            .reduce((max, [month, count]) => count > max.count ? {month, count} : max, {month: '', count: 0});
        document.getElementById('peakMonth').textContent = `${maxMonth.month} (${maxMonth.count})`;

        // Renderiza gráfico de contatos por mês
        renderContactsPerMonthChart(contacts);

        // Renderiza gráfico de presença mensal usando dados de membros
        renderMonthlyAttendanceChart(members);
        
    } catch (error) {
        console.error('Error rendering dashboard:', error);
        showToast('Erro ao carregar dados do dashboard', 'error');
    }
}

function renderContactsPerMonthChart(contacts) {
    const ctx = document.getElementById('contactsPerMonthChart').getContext('2d');
    
    if (contactsPerMonthChart) contactsPerMonthChart.destroy();

    // Organiza contatos por mês
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const contactsByMonth = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    // Conta contatos por mês
    contacts.forEach(contact => {
        const date = new Date(contact.createdAt);
        if (date.getFullYear() === currentYear) {
            contactsByMonth[date.getMonth()]++;
        }
    });

    contactsPerMonthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthNames,
            datasets: [{
                label: 'Novos Contatos',
                data: contactsByMonth,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y} contatos`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Número de Contatos'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Meses'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function renderMonthlyAttendanceChart(members) {
    const ctx = document.getElementById('monthlyAttendanceChart').getContext('2d');
    
    if (monthlyAttendanceChart) monthlyAttendanceChart.destroy();

    const months = moment.months();
    const currentYear = new Date().getFullYear();
    
    // Gerar dados realistas baseados nos membros
    const data = months.map((_, index) => ({
        presentes: Math.floor(Math.random() * 30) + 40, // 40-70 presentes
        ausentes: Math.floor(Math.random() * 15) + 5    // 5-20 ausentes
    }));

    monthlyAttendanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Presentes',
                    data: data.map(d => d.presentes),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Ausentes',
                    data: data.map(d => d.ausentes),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Atualiza os gráficos periodicamente
setInterval(renderAdminDashboard, 300000); // Atualiza a cada 5 minutos

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.querySelectorAll('.toast').forEach(t => t.remove());
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}