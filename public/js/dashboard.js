// Garante que window.getAuthHeaders existe
if (typeof window.getAuthHeaders !== 'function') {
    window.getAuthHeaders = () => ({ 'Content-Type': 'application/json' });
}

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
    const quickPhoneInput = document.getElementById('quickPhone');
    if (quickPhoneInput) {
        // Máscara dinâmica para telefone brasileiro (11 dígitos)
        quickPhoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            // Formatação: (XX) 9XXXX-XXXX
            if (value.length > 2) value = `(${value.slice(0,2)}) ${value.slice(2)}`;
            if (value.length > 10) value = `${value.slice(0, 10)}-${value.slice(10)}`;
            e.target.value = value;
        });
        // Impede colar valores inválidos
        quickPhoneInput.addEventListener('paste', function (e) {
            e.preventDefault();
            let paste = (e.clipboardData || window.clipboardData).getData('text');
            paste = paste.replace(/\D/g, '').slice(0, 11);
            let value = paste;
            if (value.length > 2) value = `(${value.slice(0,2)}) ${value.slice(2)}`;
            if (value.length > 10) value = `${value.slice(0, 10)}-${value.slice(10)}`;
            e.target.value = value;
        });
    }
    if (quickAddForm) {
        quickAddForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('quickAddContactBtn');
            if (submitBtn) submitBtn.disabled = true;
            
            const name = document.getElementById('quickName').value;
            const phone = document.getElementById('quickPhone').value;
            const birthday = document.getElementById('quickBirthday').value;

            // Validação: telefone deve ter 11 dígitos (apenas números)
            const phoneDigits = phone.replace(/\D/g, '');
            if (!name || !phone || phoneDigits.length !== 11) {
                showError('Nome e telefone válidos são obrigatórios. Telefone deve ter 11 dígitos.');
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

document.addEventListener('DOMContentLoaded', () => {
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const menuOverlay = document.querySelector('.menu-overlay');
  function toggleSidebar() {
    sidebar.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
  }
  if (sidebarToggle && sidebar && menuOverlay) {
    sidebarToggle.addEventListener('click', toggleSidebar);
    menuOverlay.addEventListener('click', toggleSidebar);
  }

  // Pequeno delay para garantir que localStorage está atualizado após login
  setTimeout(async () => {
    // Aguarda autenticação real antes de prosseguir
    const isAuth = await checkAuth();
    if (!isAuth) return;
    // Initialize event listeners
    initializeEventListeners();
    // Initialize dashboard data
    initializeDashboard();
    // Set up periodic refresh
    setInterval(initializeDashboard, 30000);
  }, 100);
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
                    <div class="action-dropdown-wrapper" style="min-width:40px; min-height:40px; display:flex; align-items:center; justify-content:center;">
                        <button class="action-trigger" data-contact-id="${contact._id}" title="Ações" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:none;border:none;padding:0;border-radius:50%;font-size:1.3em;color:#444;cursor:pointer;transition:background 0.2s;">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    activityList.innerHTML = header + contactsHtml;

    // Adiciona event listeners aos botões de ação após renderização
    document.querySelectorAll('.action-trigger').forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.stopPropagation(); // Impede propagação para não fechar imediatamente
            const contactId = btn.getAttribute('data-contact-id');
            showActions(contactId, event);
        });
    });
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
// Substitua a função showActions por esta versão corrigida
function showActions(contactId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Esconde todos os dropdowns abertos
    hideAllDropdowns();
    
    const dropdown = document.getElementById('actionDropdown');
    const button = event.currentTarget;
    const contactItem = button.closest('.activity-item');
    
    if (!dropdown || !contactItem) return;
    
    // Move o dropdown para dentro do card do contato
    const card = button.closest('.activity-item');
    if (card) {
        card.appendChild(dropdown);
        // Função para alinhar o dropdown à direita do botão, sempre visível
        function updateDropdownPosition() {
            const btnRect = button.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            // Posição do botão relativa ao card
            let left = btnRect.right - cardRect.left - dropdown.offsetWidth;
            let top = btnRect.bottom - cardRect.top + 4;
            // Garante que não ultrapasse o card
            if (left < 0) left = 0;
            if (left + dropdown.offsetWidth > card.offsetWidth) {
                left = card.offsetWidth - dropdown.offsetWidth - 8;
            }
            dropdown.style.position = 'absolute';
            dropdown.style.left = `${left}px`;
            dropdown.style.top = `${top}px`;
            dropdown.style.minWidth = '180px';
            dropdown.style.maxWidth = `${card.offsetWidth - 16}px`;
        }
        updateDropdownPosition();
        // Remove listeners antigos
        if (dropdown._removeListeners) dropdown._removeListeners();
        card.addEventListener('scroll', updateDropdownPosition, true);
        window.addEventListener('resize', updateDropdownPosition, true);
        window.addEventListener('scroll', updateDropdownPosition, true);
        dropdown._removeListeners = function() {
            card.removeEventListener('scroll', updateDropdownPosition, true);
            window.removeEventListener('resize', updateDropdownPosition, true);
            window.removeEventListener('scroll', updateDropdownPosition, true);
        };
    }
    dropdown.style.display = 'block';
    dropdown.setAttribute('data-contact-id', contactId);
    // Reatribui listeners dos botões do dropdown sempre que mostrar
    dropdown.querySelectorAll('.action-btn').forEach(button => {
        button.onclick = async (e) => {
            e.stopPropagation();
            const action = button.dataset.action;
            try {
                switch (action) {
                    case 'message': await sendMessage(contactId); break;
                    case 'reminder': await sendReminderMessage(contactId); break;
                    case 'edit': await editContact(contactId); break;
                    case 'delete': await deleteContact(contactId); break;
                    case 'convert': await convertToMember(contactId); break;
                    case 'welcome': await sendWelcomeMessage(contactId); break;
                    default: console.error('Unknown action:', action);
                }
            } catch (error) {
                console.error(`Error executing action ${action}:`, error);
                showError('Erro ao executar ação');
            } finally {
                hideAllDropdowns();
            }
        };
    });
}

// Mantenha a função hideAllDropdowns como está
function hideAllDropdowns() {
    const dropdowns = document.querySelectorAll('.action-dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
        if (dropdown._removeListeners) {
            dropdown._removeListeners();
        }
    });
}

function closeDropdownOnClickOutside(e) {
    const dropdown = document.getElementById('actionDropdown');
    if (!dropdown.contains(e.target)) {
        hideAllDropdowns();
    }
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
                case 'welcome':
                    await sendWelcomeMessage(contactId);
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
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to send message');
    }
    
    showError('Mensagem enviada com sucesso');
}

// Envia mensagem de boas-vindas via WhatsApp
async function sendWelcomeMessage(contactId) {
    try {
        const response = await fetch(`/api/contacts`);
        const contacts = await response.json();
        const contact = contacts.find(c => c._id === contactId);
        if (!contact) return showError('Contato não encontrado');
        // Importa mensagem do messages.js
        const { messages } = await import('./messages.js');
        const msg = messages.welcome(contact.name);
        await fetch(`/api/contacts/${contactId}/message`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message: msg })
        });
        showError('Mensagem de boas-vindas enviada!');
    } catch (err) {
        showError('Erro ao enviar mensagem de boas-vindas');
    }
}

// Envia lembrete de culto
async function sendReminderMessage(contactId) {
    try {
        const response = await fetch(`/api/contacts`);
        const contacts = await response.json();
        const contact = contacts.find(c => c._id === contactId);
        if (!contact) return showError('Contato não encontrado');
        // Importa mensagem do messages.js
        const { messages } = await import('./messages.js');
        const msg = messages.serviceReminderMessage(contact.name);
        await fetch(`/api/contacts/${contactId}/message`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message: msg })
        });
        showError('Lembrete de culto enviado!');
    } catch (err) {
        showError('Erro ao enviar lembrete de culto');
    }
}

// Editar contato (abre prompt simples)
async function editContact(contactId) {
    try {
        // Busca dados atuais do contato
        const response = await fetch(`/api/contacts`);
        const contacts = await response.json();
        const contact = contacts.find(c => c._id === contactId);
        if (!contact) return showError('Contato não encontrado');
        // Prompt simples para edição (pode ser substituído por modal depois)
        const name = prompt('Nome:', contact.name);
        if (name === null) return;
        const phone = prompt('Telefone (apenas números):', contact.phone);
        if (phone === null) return;
        const birthday = prompt('Data de aniversário (YYYY-MM-DD):', contact.birthday || '');
        if (birthday === null) return;
        // Atualiza contato
        const putResp = await fetch(`/api/contacts/${contactId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, phone, birthday })
        });
        if (!putResp.ok) throw new Error('Erro ao editar contato');
        await initializeDashboard();
        showError('Contato editado com sucesso');
    } catch (err) {
        showError('Erro ao editar contato');
    }
}

async function deleteContact(contactId) {
    if (!confirm('Tem certeza que deseja excluir este contato?')) {
        return;
    }
    const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
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
        headers: getAuthHeaders()
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

// Sidebar toggle para mobile (padrão users.js)
document.addEventListener('DOMContentLoaded', () => {
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const menuOverlay = document.querySelector('.menu-overlay');
  function toggleSidebar() {
    sidebar.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
  }
  if (sidebarToggle && sidebar && menuOverlay) {
    sidebarToggle.addEventListener('click', toggleSidebar);
    menuOverlay.addEventListener('click', toggleSidebar);
  }
});
