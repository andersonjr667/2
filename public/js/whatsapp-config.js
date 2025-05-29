// WhatsApp Configuration Page
document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    const qrcodeDiv = document.getElementById('qrcode');
    const connectionStatus = document.getElementById('connectionStatus');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const statusText = connectionStatus.querySelector('.status-text');

    // Socket events
    socket.on('whatsapp:qr', (qr) => {
        qrcodeDiv.innerHTML = qr;
        refreshBtn.disabled = false;
        logoutBtn.disabled = true;
        updateStatus('waiting', 'Aguardando conexão');
    });

    socket.on('whatsapp:ready', () => {
        qrcodeDiv.innerHTML = '<h2>WhatsApp conectado!</h2>';
        refreshBtn.disabled = true;
        logoutBtn.disabled = false;
        updateStatus('connected', 'Conectado');
    });

    socket.on('whatsapp:disconnected', () => {
        qrcodeDiv.innerHTML = '<p class="loading-text">Desconectado</p>';
        refreshBtn.disabled = false;
        logoutBtn.disabled = true;
        updateStatus('disconnected', 'Desconectado');
    });

    // Button click handlers
    refreshBtn.addEventListener('click', () => {
        qrcodeDiv.innerHTML = '<p class="loading-text">Gerando novo QR Code...</p>';
        socket.emit('whatsapp:refresh');
    });

    logoutBtn.addEventListener('click', () => {
        socket.emit('whatsapp:logout');
    });

    // Helper function to update status
    function updateStatus(state, text) {
        statusText.textContent = text;
        connectionStatus.className = 'status-indicator ' + state;
    }

    // Initial state
    updateStatus('disconnected', 'Desconectado');
});
