// DOM Elements
const absentList = document.getElementById('absentList');
const periodFilter = document.getElementById('periodFilter');
const searchInput = document.getElementById('searchInput');
const notifyAllBtn = document.getElementById('notifyAllBtn');
const justificationModal = document.getElementById('justificationModal');
const messageModal = document.getElementById('messageModal');
const justificationForm = document.getElementById('justificationForm');
const messageForm = document.getElementById('messageForm');

let absentMembers = [];
let currentMemberId = null;

// Load absent members
async function loadAbsentMembers() {
    try {
        const days = periodFilter.value;
        const response = await fetch(`/api/members/absent?days=${days}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Falha ao carregar membros ausentes');
        
        absentMembers = await response.json();
        renderAbsentMembers(absentMembers);
    } catch (error) {
        console.error('Erro ao carregar membros ausentes:', error);
        alert('Erro ao carregar lista de membros ausentes');
    }
}

// Calculate days absent
function calculateDaysAbsent(lastAttendance) {
    const lastDate = new Date(lastAttendance);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get status class based on days absent
function getStatusClass(days) {
    if (days >= 90) return 'critical';
    if (days >= 60) return 'warning';
    return 'normal';
}

// Render absent members table
function renderAbsentMembers(members) {
    absentList.innerHTML = members.map(member => {
        const daysAbsent = calculateDaysAbsent(member.lastAttendance);
        const statusClass = getStatusClass(daysAbsent);
        
        return `
            <tr>
                <td>${member.name}</td>
                <td>${new Date(member.lastAttendance).toLocaleDateString()}</td>
                <td class="days-absent ${statusClass}">${daysAbsent} dias</td>
                <td>${member.phone}</td>
                <td><span class="status-badge status-${member.status}">${member.status}</span></td>
                <td class="action-buttons">
                    <button onclick="notifyMember('${member._id}')" class="notify-btn">Notificar</button>
                    <button onclick="justifyAbsence('${member._id}')" class="justify-btn">Justificar</button>
                </td>
            </tr>
        `;
    }).join('');

    // Update notify all button state
    notifyAllBtn.disabled = members.length === 0;
}

// Notify single member
async function notifyMember(id) {
    currentMemberId = id;
    const member = absentMembers.find(m => m._id === id);
    
    // Pre-fill message
    document.getElementById('message').value = 
        `Olá ${member.name}, sentimos sua falta! Já faz ${calculateDaysAbsent(member.lastAttendance)} dias desde sua última presença.`;
    
    messageModal.style.display = 'block';
}

// Notify all absent members
async function notifyAllMembers() {
    if (!confirm('Deseja enviar notificação para todos os membros ausentes?')) return;

    const defaultMessage = 'Olá, sentimos sua falta! Esperamos vê-lo(a) em breve.';
    
    try {
        const promises = absentMembers.map(member =>
            fetch('/api/notify', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    number: member.phone,
                    message: defaultMessage
                })
            })
        );
        await Promise.all(promises);
        alert('Notificações enviadas com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar notificações:', error);
        alert('Erro ao enviar notificações');
    }
}

// Justify absence
function justifyAbsence(id) {
    currentMemberId = id;
    justificationModal.style.display = 'block';
}

// Handle justification form submission
justificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const justification = document.getElementById('justification').value;
    
    try {
        const response = await fetch(`/api/members/${currentMemberId}/absence`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                date: new Date().toISOString(),
                justified: true,
                justification
            })
        });

        if (!response.ok) throw new Error('Falha ao justificar ausência');
        
        justificationModal.style.display = 'none';
        loadAbsentMembers();
    } catch (error) {
        console.error('Erro ao justificar ausência:', error);
        alert('Erro ao salvar justificativa');
    }
});

// Handle message form submission
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = document.getElementById('message').value;
    const member = absentMembers.find(m => m._id === currentMemberId);
    
    try {
        const response = await fetch('/api/notify', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                number: member.phone,
                message
            })
        });

        if (!response.ok) throw new Error('Falha ao enviar mensagem');
        
        messageModal.style.display = 'none';
        alert('Mensagem enviada com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem');
    }
});

// Handle period filter change
periodFilter.addEventListener('change', loadAbsentMembers);

// Handle search input
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredMembers = absentMembers.filter(member =>
        member.name.toLowerCase().includes(searchTerm) ||
        member.phone.includes(searchTerm)
    );
    renderAbsentMembers(filteredMembers);
});

// Handle notify all button click
notifyAllBtn.addEventListener('click', notifyAllMembers);

// --- Salvar chamada rápida no backend ---
const saveAbsentBtn = document.getElementById('saveAbsentBtn');
if (saveAbsentBtn) {
    saveAbsentBtn.addEventListener('click', async () => {
        // Pega a lista de ausentes marcada na chamada rápida
        const quickAbsentList = document.getElementById('quickAbsentList');
        const absentNames = [];
        quickAbsentList.querySelectorAll('li.absent .quick-name').forEach(el => {
            absentNames.push(el.textContent.trim());
        });
        if (absentNames.length === 0) {
            alert('Selecione pelo menos um ausente para salvar.');
            return;
        }
        const today = new Date().toISOString().slice(0,10);
        // Opcional: também pode enviar telefones, se quiser
        const absents = absentNames.map(name => {
            // Busca telefone na lista de membros da chamada rápida
            const member = window.members?.find(m => m.name === name);
            return member ? { name, phone: member.phone } : { name };
        });
        try {
            const res = await fetch('/api/members/absent-list', {
                method: 'POST',
                headers: window.getAuthHeaders ? window.getAuthHeaders() : { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: today, absents })
            });
            if (!res.ok) throw new Error('Erro ao salvar chamada');
            alert('Chamada salva no sistema!');
        } catch (err) {
            alert('Erro ao salvar chamada no sistema.');
        }
    });
}

// Close modals when clicking outside or on close button
window.addEventListener('click', (e) => {
    if (e.target === justificationModal) {
        justificationModal.style.display = 'none';
    } else if (e.target === messageModal) {
        messageModal.style.display = 'none';
    }
});

document.querySelectorAll('.close').forEach(button => {
    button.addEventListener('click', () => {
        justificationModal.style.display = 'none';
        messageModal.style.display = 'none';
    });
});

document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
        justificationModal.style.display = 'none';
        messageModal.style.display = 'none';
    });
});

// Carregar lista de ausentes do backend (absentmembers.json)
async function loadQuickAbsentListFromBackend() {
    try {
        const today = new Date().toISOString().slice(0,10);
        const res = await fetch('/api/members/absent-list?date=' + today, { headers: window.getAuthHeaders ? window.getAuthHeaders() : {} });
        if (!res.ok) throw new Error('Erro ao buscar chamada do dia');
        const data = await res.json();
        // data.absents deve ser um array de { name, phone? }
        renderQuickAbsentTable(data.absents || []);
    } catch (err) {
        renderQuickAbsentTable([]);
    }
}

// Renderiza a tabela de ausentes do arquivo
function renderQuickAbsentTable(absents) {
    const tbody = document.getElementById('absentList');
    tbody.innerHTML = absents.map(absent => `
        <tr>
            <td>${absent.name || '-'}</td>
            <td>-</td>
            <td>-</td>
            <td>${absent.phone || '-'}</td>
            <td><span class="status-badge status-ausente">Ausente</span></td>
            <td class="action-buttons">
                <button class="notify-btn" title="Notificar"><i class="fas fa-bell"></i></button>
            </td>
        </tr>
    `).join('');
}

// Carregar histórico de ausências agrupado por membro
async function loadAbsentHistory() {
    try {
        const res = await fetch('/api/members/absent-list/history', { headers: window.getAuthHeaders ? window.getAuthHeaders() : {} });
        if (!res.ok) throw new Error('Erro ao buscar histórico de ausências');
        const data = await res.json();
        renderAbsentHistoryTable(data);
    } catch (err) {
        renderAbsentHistoryTable([]);
    }
}

// Renderiza a tabela principal com histórico de faltas
function renderAbsentHistoryTable(members) {
    const tbody = document.getElementById('absentList');
    tbody.innerHTML = members.map(member => {
        const absences = (member.absences || []).slice(0, 5).map(date => {
            const d = new Date(date);
            return d.toLocaleDateString();
        }).join(', ');
        return `
            <tr>
                <td>${member.name || '-'}</td>
                <td>${absences || '-'}</td>
                <td>${member.phone || '-'}</td>
                <td><span class="status-badge status-ausente">Ausente</span></td>
                <td class="action-buttons">
                    <button class="notify-btn" title="Notificar"><i class="fas fa-bell"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// Substitui o carregamento padrão ao iniciar
window.addEventListener('DOMContentLoaded', () => {
    if (!window.checkAuth || !window.checkAuth()) return;
    loadAbsentHistory();
});
