document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorToast = document.getElementById('errorToast');
    const serverError = document.getElementById('serverError');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.className = `fas fa-${type === 'password' ? 'eye' : 'eye-slash'} password-toggle`;
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        serverError.classList.remove('show');
        serverError.textContent = '';
        errorToast.classList.remove('show');
        errorToast.textContent = '';
        try {
            const formData = new FormData(loginForm);
            const loginData = {
                login: formData.get('username'), // Corrige para enviar 'login' (username ou email)
                password: formData.get('password')
            };

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (!response.ok) {
                if (response.status >= 500) {
                    serverError.textContent = 'Erro no servidor. Tente novamente mais tarde.';
                    serverError.classList.add('show');
                } else {
                    const data = await response.json().catch(() => ({}));
                    showError(data.message || 'Usuário ou senha inválidos');
                }
                return;
            }

            const data = await response.json();

            // Salva token e dados do usuário no localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redireciona para o dashboard
            window.location.href = '/pages/dashboard.html';
        } catch (error) {
            serverError.textContent = 'Erro no servidor. Tente novamente mais tarde.';
            serverError.classList.add('show');
        }
    });

    function showError(message) {
        errorToast.textContent = message;
        errorToast.classList.add('show');
    }
});
