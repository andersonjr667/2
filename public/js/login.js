document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorToast = document.getElementById('errorToast');
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
        try {
            const formData = new FormData(loginForm);
            const loginData = {
                login: formData.get('login'),
                password: formData.get('password')
            };

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (!response.ok || !data.success || !data.token) {
                showError(data.message || 'Usuário ou senha inválidos');
                return;
            }

            // Salva token e dados do usuário no localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redireciona para o dashboard
            window.location.href = '/pages/dashboard.html';
        } catch (error) {
            console.error('Login error:', error);
            showError('Erro ao conectar ao servidor');
        }
    });

    function showError(message) {
        errorToast.textContent = message;
        errorToast.style.display = 'block';
        setTimeout(() => {
            errorToast.style.display = 'none';
        }, 3000);
    }
});
