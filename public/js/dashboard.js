// Initialize dashboard
async function initializeDashboard() {
    try {
        const response = await fetch('/api/contacts', { headers: getAuthHeaders() });
        if (!response.ok) {
           
        }
        const contacts = await response.json();
        console.log('[DASHBOARD] Contatos recebidos da API:', contacts); // LOG DE DIAGNÓSTICO
        // Garante que todos os contatos tenham status
        const safeContacts = contacts.map(c => ({ ...c, status: c.status || 'novo' }));
        updateStats(safeContacts);
        updateContactsList(safeContacts);
    } catch (error) {
        console.error('Dashboard error:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            localStorage.clear();
            window.location.href = '/pages/login.html';
        }
    }
}

// Initialize all event listeners
function initializeEventListeners() {
    // Logout button
    addSafeEventListener('logoutBtn', 'click', () => {
        localStorage.clear();
        window.location.href = '/pages/login.html';
    });

    // Add contact button
    addSafeEventListener('addContactBtn', 'click', () => {
        const modal = document.getElementById('contactModal');
        if (modal) modal.style.display = 'block';
    });

    // Close modal buttons
    document.querySelectorAll('.close, .close-modal').forEach(element => {
        element?.addEventListener('click', () => {
            const modal = document.getElementById('contactModal');
            if (modal) {
                modal.style.display = 'none';
                const form = document.getElementById('contactForm');
                if (form) form.reset();
            }
        });
    });

    // Atualizar o event listener do formulário de adição rápida
    const quickAddForm = document.getElementById('quickAddForm');
    if (quickAddForm) {
        quickAddForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('quickAddContactBtn');
            if (submitBtn) submitBtn.disabled = true;
            
            const name = document.getElementById('quickName').value;
            const phone = document.getElementById('quickPhone').value;
            const birthday = document.getElementById('quickBirthday').value;

            if (!name || !phone) {
                showError('Nome e telefone são obrigatórios');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            try {
                const userData = JSON.parse(localStorage.getItem('user'));
                const payload = {
                    name: name,
                    phone: phone.replace(/\D/g, ''),
                    birthday: birthday || null,
                    owner: userData.username,
                    username: userData.username
                };

                const response = await fetch('/api/contacts', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error('Erro ao criar contato');
                }

                // Limpar campos
                document.getElementById('quickName').value = '';
                document.getElementById('quickPhone').value = '';
                document.getElementById('quickBirthday').value = '';
                
                // Atualizar lista de contatos
                await initializeDashboard();
                showError('Contato adicionado com sucesso');
            } catch (error) {
                console.error('Erro ao criar contato:', error);
                showError('Erro ao criar contato');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
}

// Wait for DOM to be ready
// Unifica toda a inicialização em um único bloco assíncrono

document.addEventListener('DOMContentLoaded', async () => {
    // Pequeno delay para garantir que localStorage está atualizado após login
    await new Promise(resolve => setTimeout(resolve, 100));

    // Removido: if (!initializePage()) return;

    // Aguarda autenticação real antes de prosseguir
    const isAuth = await checkAuth();
    if (!isAuth) return;

    // Initialize event listeners
    initializeEventListeners();
    // Initialize dashboard data
    initializeDashboard();
    // Set up periodic refresh
    setInterval(initializeDashboard, 30000);

    // Sidebar/menu listeners
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const menuOverlay = document.querySelector('.menu-overlay');
    const content = document.querySelector('.content');

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        menuOverlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (menuOverlay) menuOverlay.addEventListener('click', toggleSidebar);
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && sidebar && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
});

// Helper function to add a contact quickly
async function addQuickContact(contactData) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const payload = {
            name: contactData.name,
            phone: contactData.phone.replace(/\D/g, ''),
            birthday: contactData.birthday || null,
            owner: user.username,
            username: user.username
        };
        const response = await fetch('/api/contacts', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error('Falha ao criar contato');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro em addQuickContact:', error);
        throw error;
    }
}

function updateStats(contacts) {
    // Total de Contatos
    document.getElementById('totalContacts').textContent = contacts.length;
    
    // Contatos Hoje
    const today = new Date().toISOString().split('T')[0];
    const contactsToday = contacts.filter(contact => {
        const contactDate = new Date(contact.createdAt).toISOString().split('T')[0];
        return contactDate === today;
    }).length;
    document.getElementById('todayAttendance').textContent = contactsToday;

    // Visitantes (contatos com status 'novo')
    const visitors = contacts.filter(contact => contact.status === 'novo').length;
    document.getElementById('totalVisitors').textContent = visitors;
}

function formatDate(dateStr) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function updateContactsList(contacts) {
    const activityList = document.getElementById('activityList');
    
    if (!contacts || contacts.length === 0) {
        activityList.innerHTML = `
            <div class="activity-header">
                <div class="activity-col">Nome</div>
                <div class="activity-col">Número</div>
                <div class="activity-col">Data de Adição</div>
                <div class="activity-col">Aniversário</div>
                <div class="activity-col">Status Mensagem</div>
                <div class="activity-col">Ações</div>
            </div>
            <div class="activity-item">Nenhum contato registrado</div>
        `;
        return;
    }

    const header = `
        <div class="activity-header">
            <div class="activity-col">Nome</div>
            <div class="activity-col">Número</div>
            <div class="activity-col">Data de Adição</div>
            <div class="activity-col">Aniversário</div>
            <div class="activity-col">Status Mensagem</div>
            <div class="activity-col">Ações</div>
        </div>
    `;

    const contactsHtml = contacts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(contact => `
            <div class="activity-item">
                <div class="activity-col">${contact.name}</div>
                <div class="activity-col">${formatPhone(contact.phone)}</div>
                <div class="activity-col">${formatDate(contact.createdAt)}</div>
                <div class="activity-col">${contact.birthday ? formatDate(contact.birthday) : '--'}</div>
                <div class="activity-col">
                    <span class="message-status ${contact.receivedMessage ? 'message-sent' : 'message-pending'}">
                        <i class="fas ${contact.receivedMessage ? 'fa-check-circle' : 'fa-clock'}"></i>
                        ${contact.receivedMessage ? 'Enviada' : 'Pendente'}
                    </span>
                </div>
                <div class="activity-col">
                    <button onclick="showActions('${contact._id}', event)" class="action-trigger">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
        `).join('');

    activityList.innerHTML = header + contactsHtml;
}

// Helper function to format phone numbers
function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
    }
    return phone;
}

// Add action handlers
function showActions(contactId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropdown = document.getElementById('actionDropdown');
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Hide any open dropdowns first
    hideAllDropdowns();
    
    // Position dropdown
    dropdown.style.display = 'block';
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    dropdown.style.left = `${rect.left - 150}px`;
    
    // Store current contact ID
    dropdown.setAttribute('data-contact-id', contactId);
}

function hideAllDropdowns() {
    const dropdowns = document.querySelectorAll('.action-dropdown');
    dropdowns.forEach(dropdown => dropdown.style.display = 'none');
}

// Event listeners for action buttons
const actionButtons = document.querySelectorAll('.action-btn');
actionButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const contactId = document.getElementById('actionDropdown')?.getAttribute('data-contact-id');
        
        if (!contactId) return;

        try {
            switch (action) {
                case 'message':
                    await sendMessage(contactId);
                    break;
                case 'edit':
                    await editContact(contactId);
                    break;
                case 'delete':
                    await deleteContact(contactId);
                    break;
                case 'convert':
                    await convertToMember(contactId);
                    break;
                default:
                    console.error('Unknown action:', action);
            }
        } catch (error) {
            console.error(`Error executing action ${action}:`, error);
            showError('Erro ao executar ação');
        } finally {
            hideAllDropdowns();
        }
    });
});

// Action handler functions
async function sendMessage(contactId) {
    const response = await fetch(`/api/contacts/${contactId}/message`, {
        method: 'POST',
        headers: window.headers
    });
    
    if (!response.ok) {
        throw new Error('Failed to send message');
    }
    
    showError('Mensagem enviada com sucesso');
}

async function editContact(contactId) {
    // Implementation will be added later
    showError('Funcionalidade em desenvolvimento');
}

async function deleteContact(contactId) {
    if (!confirm('Tem certeza que deseja excluir este contato?')) {
        return;
    }
    
    const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: window.headers
    });
    
    if (!response.ok) {
        throw new Error('Failed to delete contact');
    }
    
    await initializeDashboard();
    showError('Contato excluído com sucesso');
}

async function convertToMember(contactId) {
    const response = await fetch(`/api/contacts/${contactId}/convert`, {
        method: 'POST',
        headers: window.headers
    });
    
    if (!response.ok) {
        throw new Error('Failed to convert contact');
    }
    
    await initializeDashboard();
    showError('Contato convertido com sucesso');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.action-trigger') && !e.target.closest('.action-dropdown')) {
        hideAllDropdowns();
    }
});

// Helper function to show error messages
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/pages/login.html';
});

// Add contact modal functionality
const contactModal = document.getElementById('contactModal');
const contactForm = document.getElementById('contactForm');
const addContactBtn = document.getElementById('addContactBtn');

// Open modal
if (addContactBtn && contactModal) {
    addContactBtn.addEventListener('click', () => {
        contactModal.style.display = 'block';
    });
}

// Close modal
if (contactModal && contactForm) {
    document.querySelectorAll('.close, .close-modal').forEach(element => {
        element.addEventListener('click', () => {
            contactModal.style.display = 'none';
            contactForm.reset();
        });
    });

    // Handle form submission
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(contactForm);
            const contactData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                birthday: formData.get('birthday') || null,
                status: formData.get('status')
            };
            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(contactData)
            });
            if (!response.ok) throw new Error('Falha ao criar contato');
            await initializeDashboard();
            contactModal.style.display = 'none';
            contactForm.reset();
            showError('Contato adicionado com sucesso');
        } catch (error) {
            console.error('Erro ao criar contato:', error);
            showError('Erro ao criar contato');
        }
    });
}

// Safe event listener addition
function addSafeEventListener(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(event, handler);
    }
}
