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
        // Carrega sempre do arquivo local
        const response = await fetch('/db/members.json');
        if (!response.ok) throw new Error('Falha ao carregar arquivo local');
        members = await response.json();
        filterAndRenderMembers();
    } catch (error) {
        console.error('Erro ao carregar membros do arquivo local:', error);
        showToast('Erro ao carregar lista de membros', 'error');
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
    } catch (error) {
        console.error('Erro ao registrar presença:', error);
        showToast('Erro ao registrar presença', 'error');
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

// Render members grid
function renderMembers(membersToRender) {
    if (!membersToRender || membersToRender.length === 0) {
        membersGrid.innerHTML = '<p class="no-members">Nenhum membro encontrado</p>';
        return;
    }

    // Pega usuário logado e role
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const username = user?.username || '';
    const isAdmin = user?.role === 'admin';

    membersGrid.innerHTML = membersToRender.map(member => {
        let discipuladorHtml = '';
        let discipuladorActions = '';
        if (member.discipleBy) {
            discipuladorHtml = `<p><i class="fas fa-user-friends"></i> Discipulador: ${member.discipleBy}</p>`;
            if (isAdmin) {
                discipuladorActions = `<button onclick="window.removeDiscipulador('${member._id}')" class="btn-warning"><i class='fas fa-user-minus'></i> Remover Discipulador</button>`;
            }
        } else {
            discipuladorActions = `<button onclick="window.setDiscipulador('${member._id}')" class="btn-success"><i class='fas fa-user-plus'></i> Tornar discípulo</button>`;
        }
        return `
        <div class="member-card">
            <div class="member-header">
                <h3 class="member-name">${member.name}</h3>
                <span class="member-status ${member.isDisciple ? 'status-ativo' : 'status-visitante'}">
                    ${member.isDisciple ? 'Discípulo' : 'Visitante'}
                </span>
            </div>
            <div class="member-info">
                <p><i class="fas fa-phone"></i> ${formatPhone(member.phone)}</p>
                ${member.email ? `<p><i class="fas fa-envelope"></i> ${member.email}</p>` : ''}
                ${member.birthday ? `<p><i class="fas fa-birthday-cake"></i> ${new Date(member.birthday).toLocaleDateString()}</p>` : ''}
                <p><i class="fas fa-calendar-check"></i> Última atualização: ${new Date(member.updatedAt).toLocaleDateString()}</p>
                ${discipuladorHtml}
            </div>
            <div class="member-actions">
                ${discipuladorActions}
                <button onclick="editMember('${member._id}')" class="btn-edit">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteMember('${member._id}')" class="btn-delete">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Helper function to format phone numbers
function formatPhone(phone) {
    if (!phone) return '';
    // Remove tudo que não for número
    const cleaned = phone.replace(/\D/g, '');
    // Celular com DDD (11 dígitos)
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
    }
    // Telefone fixo com DDD (10 dígitos)
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
    }
    // Internacional (13 dígitos, ex: +55 31 99999-9999)
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
        return `+${cleaned.slice(0,2)} (${cleaned.slice(2,4)}) ${cleaned.slice(4,9)}-${cleaned.slice(9)}`;
    }
    // Apenas DDD (2 dígitos) + número
    if (cleaned.length > 2) {
        return `(${cleaned.slice(0,2)}) ${cleaned.slice(2)}`;
    }
    return phone;
}

// Filter and render members
function filterAndRenderMembers() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    // const attendanceValue = attendanceFilter.value; // não usado

    let filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm) ||
            (member.phone && member.phone.includes(searchTerm)) ||
            (member.email && member.email.toLowerCase().includes(searchTerm));

        let matchesStatus = true;
        if (statusValue === 'disciple') {
            matchesStatus = member.isDisciple === true;
        } else if (statusValue === 'visitante') {
            matchesStatus = member.isDisciple === false;
        }
        return matchesSearch && matchesStatus;
    });

    // Ordena alfabeticamente por nome
    filteredMembers.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    renderMembers(filteredMembers);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    loadMembers();
    
    // Event listeners
    searchInput.addEventListener('input', filterAndRenderMembers);
    statusFilter.addEventListener('change', filterAndRenderMembers);
    attendanceFilter.addEventListener('change', filterAndRenderMembers);
    
    // Form submission
    memberForm.addEventListener('submit', handleFormSubmit);
    
    // Modal close buttons
    document.querySelectorAll('.close, .close-modal').forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Add member button
    document.getElementById('addMemberBtn').addEventListener('click', () => {
        currentMemberId = null;
        modalTitle.textContent = 'Novo Membro';
        memberForm.reset();
        openModal();
    });
});

// Edit member
async function editMember(id) {
    currentMemberId = id;
    const member = members.find(m => m._id === id);
    
    modalTitle.textContent = 'Editar Membro';
    document.getElementById('name').value = member.name;
    document.getElementById('phone').value = member.phone;
    document.getElementById('email').value = member.email || '';
    document.getElementById('birthDate').value = member.birthDate ? member.birthDate.split('T')[0] : '';
    document.getElementById('status').value = member.status;
    document.getElementById('address').value = member.address?.street || '';
    
    modal.style.display = 'block';
}

// Delete member
async function deleteMember(id) {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return;

    try {
        const response = await fetch(`/api/members/${id}`, {
            method: 'DELETE',
            headers: window.getAuthHeaders()
        });

        if (!response.ok) throw new Error('Falha ao excluir membro');
        
        members = members.filter(m => m._id !== id);
        renderMembers(members);
    } catch (error) {
        console.error('Erro ao excluir membro:', error);
        alert('Erro ao excluir membro');
    }
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

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(memberForm);
    const memberData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        birthDate: formData.get('birthDate'),
        status: formData.get('status'),
        discipleBy: formData.get('discipleBy'),
        address: formData.get('address'),
        notificationPreferences: {
            whatsapp: formData.get('whatsapp') === 'on',
            email: formData.get('email') === 'on'
        }
    };

    try {
        const url = currentMemberId ? `/api/members/${currentMemberId}` : '/api/members';
        const method = currentMemberId ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: window.getAuthHeaders(),
            body: JSON.stringify(memberData)
        });

        if (!response.ok) throw new Error('Falha ao salvar membro');
        
        await loadMembers();
        closeModal();
        showToast(`Membro ${currentMemberId ? 'atualizado' : 'criado'} com sucesso`);
    } catch (error) {
        console.error('Erro ao salvar membro:', error);
        showToast('Erro ao salvar membro', 'error');
    }
}

// Open modal
function openModal() {
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    memberForm.reset();
}

// Show attendance statistics modal
async function showAttendanceStats(memberId) {
    const stats = await getAttendanceStats(memberId);
    if (!stats) return;

    const member = members.find(m => m._id === memberId);
    if (!member) return;

    const statsModal = document.getElementById('statsModal') || createStatsModal();
    const modalContent = `
        <h2>Estatísticas de Presença - ${member.name}</h2>
        <div class="stats-container">
            <div class="stat-item">
                <h3>Taxa de Presença</h3>
                <p>${stats.attendanceRate}%</p>
            </div>
            <div class="stat-item">
                <h3>Total de Presenças</h3>
                <p>${stats.present}</p>
            </div>
            <div class="stat-item">
                <h3>Total de Ausências</h3>
                <p>${stats.absent}</p>
            </div>
            <div class="stat-item">
                <h3>Total de Registros</h3>
                <p>${stats.total}</p>
            </div>
        </div>
    `;

    statsModal.querySelector('.modal-content').innerHTML = modalContent;
    statsModal.style.display = 'block';
}

// Create stats modal if it doesn't exist
function createStatsModal() {
    const modal = document.createElement('div');
    modal.id = 'statsModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
        </div>
        <span class="close" onclick="document.getElementById('statsModal').style.display='none'">&times;</span>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Nova função para tornar membro em discípulo
async function convertToDisciple(memberId) {
    // Mantém para compatibilidade, mas não usada mais
}

// Nova função para definir discipulador
window.setDiscipulador = function(memberId) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    const member = members.find(m => m._id === memberId);
    if (!member) return;
    member.discipleBy = user.username;
    showToast('Você agora é o discipulador deste membro!', 'success');
    renderMembers(members);
};

window.removeDiscipulador = function(memberId) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.role !== 'admin') return;
    const member = members.find(m => m._id === memberId);
    if (!member) return;
    member.discipleBy = '';
    showToast('Discipulador removido com sucesso!', 'success');
    renderMembers(members);
};
