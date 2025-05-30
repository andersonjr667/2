let members = [];
let currentMemberId = null;

// DOM Elements
const membersGrid = document.querySelector('.members-grid');
const modal = document.getElementById('memberModal');
const modalTitle = document.getElementById('modalTitle');
const memberForm = document.getElementById('memberForm');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const attendanceFilter = document.getElementById('attendanceFilter');

// Load members
async function loadMembers() {
    try {
        const response = await fetch('/db/members.json');
        if (!response.ok) throw new Error('Erro ao carregar membros');
        members = await response.json();
        filterAndRenderMembers();
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao carregar membros', 'error');
    }
}

// Record attendance for a member
async function recordAttendance(memberId, present) {
    try {
        const response = await fetch(`/api/members/${memberId}/attendance`, {
            method: 'POST',
            headers: window.getAuthHeaders(),
            body: JSON.stringify({
                date: new Date(),
                present
            })
        });

        if (!response.ok) throw new Error('Falha ao registrar presença');
        
        const updatedMember = await response.json();
        const memberIndex = members.findIndex(m => m._id === memberId);
        if (memberIndex !== -1) {
            members[memberIndex] = updatedMember;
            renderMembers(members);
        }

        showToast(present ? 'Presença registrada com sucesso' : 'Ausência registrada com sucesso');
        await window.logAction('record_attendance', 
            `Presença registrada para membro ID ${memberId}: ${present ? 'Presente' : 'Ausente'}`);
    } catch (error) {
        console.error('Erro ao registrar presença:', error);
        showToast('Erro ao registrar presença', 'error');
        await window.logAction('error', `Erro ao registrar presença: ${error.message}`, 'error');
    }
}

// Get attendance statistics for a member
async function getAttendanceStats(memberId) {
    try {
        const response = await fetch(`/api/members/${memberId}/attendance`, { headers: window.getAuthHeaders() });
        if (!response.ok) throw new Error('Falha ao carregar estatísticas');
        
        const stats = await response.json();
        return stats;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        return null;
    }
}

// Export members to CSV
function exportMembersToCSV() {
    if (!members || members.length === 0) {
        showToast('Nenhum membro para exportar', 'error');
        return;
    }
    const headers = ['Nome', 'Telefone', 'Email', 'Status', 'Discipulador', 'Data de Nascimento', 'Endereço', 'Data de Cadastro'];
    const rows = members.map(m => [
        m.name || '',
        formatPhone(m.phone) || '',
        m.email || '',
        m.status || '',
        m.discipleBy || '',
        m.birthDate ? new Date(m.birthDate).toLocaleDateString() : '',
        typeof m.address === 'object' && m.address !== null ? Object.values(m.address).filter(Boolean).join(', ') : (m.address || ''),
        m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ''
    ]);
    let csv = headers.join(';') + '\n';
    rows.forEach(r => {
        csv += r.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(';') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'membros.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Render members grid (corrigido: mais campos, address, discipulador, data de cadastro)
function renderMembers(membersToRender) {
    if (!membersToRender || membersToRender.length === 0) {
        membersGrid.innerHTML = '<p>Nenhum membro encontrado.</p>';
        return;
    }
    membersGrid.innerHTML = membersToRender.map(member => {
        const address = typeof member.address === 'object' && member.address !== null
            ? Object.values(member.address).filter(Boolean).join(', ')
            : (member.address || '');
        return `
        <div class="member-card">
            <div class="member-header">
                <h3 class="member-name">${member.name || ''}</h3>
                <span class="member-status ${member.status || 'ativo'}">${member.status || 'ativo'}</span>
            </div>
            <div class="member-info">
                <p><i class="fas fa-phone"></i> ${formatPhone(member.phone) || 'Não informado'}</p>
                ${member.email ? `<p><i class='fas fa-envelope'></i> ${member.email}</p>` : ''}
                ${address ? `<p><i class='fas fa-map-marker-alt'></i> ${address}</p>` : ''}
                ${member.birthDate ? `<p><i class='fas fa-birthday-cake'></i> ${new Date(member.birthDate).toLocaleDateString()}</p>` : ''}
                ${member.discipleBy ? `<p><i class='fas fa-user-graduate'></i> Discipulador: ${member.discipleBy}</p>` : ''}
                ${member.createdAt ? `<p><i class='fas fa-calendar-plus'></i> Cadastro: ${new Date(member.createdAt).toLocaleDateString()}</p>` : ''}
            </div>
            <div class="member-actions">
                <button class="btn-edit" onclick="editMember('${member._id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete" onclick="confirmDeleteMember('${member._id}', '${member.name}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
                <button class="btn-status" onclick="toggleStatus('${member._id}', '${member.status || 'ativo'}')">
                    <i class="fas fa-exchange-alt"></i> ${member.status === 'inativo' ? 'Ativar' : 'Desativar'}
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Filtro de status e presença
function filterAndRenderMembers() {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const attendance = attendanceFilter.value;
    const today = new Date().toISOString().split('T')[0];
    const filtered = members.filter(member => {
        const matchesSearch = (member.name?.toLowerCase().includes(searchTerm) || 
                             member.phone?.includes(searchTerm) ||
                             member.email?.toLowerCase().includes(searchTerm));
        const matchesStatus = !status || member.status === status;
        let matchesAttendance = true;
        if (attendance === 'present') {
            matchesAttendance = member.lastAttendance && member.lastAttendance.split('T')[0] === today;
        } else if (attendance === 'absent') {
            matchesAttendance = !member.lastAttendance || member.lastAttendance.split('T')[0] !== today;
        } else if (attendance === 'inactive') {
            if (member.lastAttendance) {
                const last = new Date(member.lastAttendance);
                const diff = (new Date() - last) / (1000*60*60*24);
                matchesAttendance = diff >= 14;
            } else {
                matchesAttendance = true;
            }
        }
        return matchesSearch && matchesStatus && matchesAttendance;
    });
    renderMembers(filtered);
}

// Edit member
async function editMember(id) {
    try {
        currentMemberId = id;
        const member = members.find(m => m._id === id);
        if (!member) throw new Error('Membro não encontrado');

        document.getElementById('name').value = member.name || '';
        document.getElementById('phone').value = member.phone || '';
        document.getElementById('email').value = member.email || '';
        document.getElementById('status').value = member.status || 'ativo';
        document.getElementById('address').value = member.address || '';
        document.getElementById('discipleBy').value = member.discipleBy || '';
        
        if (member.birthDate) {
            document.getElementById('birthDate').value = member.birthDate.split('T')[0];
        }

        modalTitle.textContent = 'Editar Membro';
        modal.style.display = 'block';
    } catch (error) {
        showToast('Erro ao carregar dados do membro', 'error');
    }
}

// Delete member
function confirmDeleteMember(id, name) {
    if (confirm(`Deseja realmente excluir o membro "${name}"?`)) {
        deleteMember(id);
    }
}

async function deleteMember(id) {
    try {
        const response = await fetch(`/api/members/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erro ao excluir membro');

        await loadMembers();
        showToast('Membro excluído com sucesso');
    } catch (error) {
        showToast('Erro ao excluir membro', 'error');
    }
}

// Toggle member status
async function toggleStatus(id, currentStatus) {
    try {
        const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
        const response = await fetch(`/api/members/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Erro ao alterar status');

        await loadMembers();
        showToast(`Status alterado para ${newStatus}`);
    } catch (error) {
        showToast('Erro ao alterar status', 'error');
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        birthDate: document.getElementById('birthDate').value,
        status: document.getElementById('status').value,
        address: document.getElementById('address').value,
        discipleBy: document.getElementById('discipleBy').value
    };

    try {
        const url = currentMemberId 
            ? `/api/members/${currentMemberId}` 
            : '/api/members';
            
        const response = await fetch(url, {
            method: currentMemberId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Erro ao salvar membro');

        await loadMembers();
        modal.style.display = 'none';
        showToast(currentMemberId ? 'Membro atualizado com sucesso!' : 'Membro adicionado com sucesso!');
        
    } catch (error) {
        showToast('Erro ao salvar membro', 'error');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadMembers();
    
    // Event listeners
    searchInput.addEventListener('input', filterAndRenderMembers);
    statusFilter.addEventListener('change', filterAndRenderMembers);
    memberForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('exportBtn').onclick = exportMembersToCSV;
    attendanceFilter.addEventListener('change', filterAndRenderMembers);
    
    // Modal controls
    document.querySelector('.close').onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
    
    document.getElementById('addMemberBtn').onclick = () => {
        currentMemberId = null;
        memberForm.reset();
        modalTitle.textContent = 'Novo Membro';
        modal.style.display = 'block';
    };

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = '/pages/login.html';
        });
    }
});

// Helper function to format phone numbers
function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
    }
    return phone;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Expor funções globais para onclick inline
window.editMember = editMember;
window.confirmDeleteMember = confirmDeleteMember;
window.toggleStatus = toggleStatus;
