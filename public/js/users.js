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

  // Sidebar toggle para mobile
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const menuOverlay = document.querySelector('.menu-overlay');
  function toggleSidebar() {
    sidebar.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
  }
  sidebarToggle.addEventListener('click', toggleSidebar);
  menuOverlay.addEventListener('click', toggleSidebar);

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = '/pages/login.html';
    });
  }
});
