// Add headers configuration at the top
const headers = {
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('token')
};

// DOM Elements
const systemLogs = document.getElementById('systemLogs');
const refreshLogsBtn = document.getElementById('refreshLogsBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    loadSystemLogs();
});

// Event Listeners
refreshLogsBtn.addEventListener('click', loadSystemLogs);
clearLogsBtn.addEventListener('click', clearSystemLogs);

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