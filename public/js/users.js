// users.js - Carrega e exibe usuários do banco users.json

// Função para buscar e renderizar usuários do banco users.json
async function fetchAndRenderUsers() {
    try {
        // Busca diretamente o arquivo users.json do backend (rota estática)
        const response = await fetch('../db/users.json');
        if (!response.ok) {
            throw new Error('Erro ao buscar users.json');
        }
        const users = await response.json();
        // Filtra apenas usuários que têm username
        const filteredUsers = users.filter(u => u.username);
        document.getElementById('totalUsers').textContent = filteredUsers.length;
        document.getElementById('totalAdmins').textContent = filteredUsers.filter(u => u.role === 'admin').length;
        document.getElementById('totalNormalUsers').textContent = filteredUsers.filter(u => u.role === 'user').length;
        renderUserTable(filteredUsers);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
    }
}

function renderUserStats(users) {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const normalUsers = users.filter(u => u.role === 'user').length;
    document.getElementById('totalUsers').textContent = total;
    document.getElementById('totalAdmins').textContent = admins;
    document.getElementById('totalNormalUsers').textContent = normalUsers;
}

function renderUserTable(users) {
    const tableBody = document.querySelector('#usersTable tbody');
    tableBody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>${user.role ? user.role : '-'}</td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
            <td>${user._id}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Chamada inicial
document.addEventListener('DOMContentLoaded', fetchAndRenderUsers);

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar toggle para mobile (modelo dashboard)
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
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = '/pages/login.html';
    });
  }
  // Delegated event listeners for user actions (table)
  const usersTable = document.getElementById('usersTable');
  if (usersTable) {
    usersTable.addEventListener('click', function(e) {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const userId = btn.getAttribute('data-user-id');
      if (action === 'role') {
        const currentRole = btn.getAttribute('data-user-role');
        changeRole(userId, currentRole);
      } else if (action === 'delete') {
        const username = btn.getAttribute('data-username');
        confirmDelete(userId, username);
      }
    });
  }
  // Delegated event listeners for user actions (card view)
  const usersList = document.getElementById('users-list');
  if (usersList) {
    usersList.addEventListener('click', function(e) {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const userId = btn.getAttribute('data-user-id');
      if (action === 'role') {
        const currentRole = btn.getAttribute('data-user-role');
        changeRole(userId, currentRole);
      } else if (action === 'delete') {
        const username = btn.getAttribute('data-username');
        confirmDelete(userId, username);
      }
    });
  }
});

async function changeRole(userId, currentRole) {
    if (!confirm(`Deseja alterar o papel do usuário de ${currentRole} para ${currentRole === 'admin' ? 'user' : 'admin'}?`)) {
        return;
    }

    try {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const response = await fetch(`/api/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });

        if (!response.ok) throw new Error('Falha ao alterar papel');
        
        // Recarrega os usuários
        await fetchAndRenderUsers();
        alert('Papel alterado com sucesso!');
        await window.logAction('change_role', 
            `Papel do usuário ${userId} alterado de ${currentRole} para ${newRole}`);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao alterar papel do usuário');
        await window.logAction('error', `Erro ao alterar papel: ${error.message}`, 'error');
    }
}

async function deleteUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Falha ao excluir usuário');
        
        // Recarrega os usuários
        await fetchAndRenderUsers();
        alert('Usuário excluído com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir usuário');
    }
}

function confirmDelete(userId, username) {
    if (confirm(`Tem certeza que deseja excluir o usuário "${username}"?`)) {
        deleteUser(userId);
    }
}

// Nenhum código interferindo na renderização dos botões dos usuários
