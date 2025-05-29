document.addEventListener('DOMContentLoaded', function() {
    const statusMessage = document.querySelector('.status-message');
    const errorMessage = document.getElementById('errorMessage');

    // Função global para obter headers de autenticação
    window.getAuthHeaders = function() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        };
    };

    // Função global para verificar autenticação e atualizar usuário
    window.checkAuth = async function() {
        const token = localStorage.getItem('token');
        if (!token) {
            if (
                window.location.pathname.endsWith('index.html') ||
                window.location.pathname === '/' ||
                window.location.pathname.endsWith('/')
            ) {
                // Não faz nada, está na tela de loading
            } else {
                window.location.href = '/pages/login.html';
            }
            return false;
        }
        try {
            const res = await fetch('/api/auth/verify', {
                headers: window.getAuthHeaders()
            });
            if (!res.ok) throw new Error('Token inválido');
            const data = await res.json();
            // Atualiza nome do usuário e role no localStorage
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                document.body.setAttribute('data-role', data.user.role);
            }
            // Atualiza nome na UI se existir
            const userNameElement = document.getElementById('userName');
            if (userNameElement && data.user && data.user.username) {
                userNameElement.textContent = data.user.username;
            }
            return true;
        } catch (err) {
            localStorage.clear();
            if (
                window.location.pathname.endsWith('index.html') ||
                window.location.pathname === '/' ||
                window.location.pathname.endsWith('/')
            ) {
                if (statusMessage) statusMessage.textContent = 'Sessão expirada. Redirecionando para login...';
                setTimeout(() => window.location.href = '/pages/login.html', 1200);
            } else {
                window.location.href = '/pages/login.html';
            }
            return false;
        }
    };

    // Função para carregar nome do usuário na UI
    window.loadUserName = function() {
        const userNameElement = document.getElementById('userName');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (userNameElement && user && user.username) {
            userNameElement.textContent = user.username;
        }
    };

    // Executa as verificações
    const isLoginPage = window.location.pathname.endsWith('login.html');
    if (!isLoginPage) {
        window.checkAuth();
    }
    window.loadUserName();
});
