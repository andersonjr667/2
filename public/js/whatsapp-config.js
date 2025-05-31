// WhatsApp Configuration Page
document.addEventListener('DOMContentLoaded', () => {
    // Estabelece conexão com Socket.IO
    const socket = io();

    // Elementos do DOM
    const qrContainer = document.getElementById('qrContainer');
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    const connectionStatus = document.getElementById('connectionStatus');
    const refreshQrBtn = document.getElementById('refreshQrBtn');
    const logoutWhatsAppBtn = document.getElementById('logoutWhatsAppBtn');

    // Função para atualizar o status da conexão
    function updateStatus(status, connected = false) {
        const statusText = document.querySelector('.status-text');
        statusText.textContent = status;
        connectionStatus.classList.toggle('connected', connected);
        refreshQrBtn.disabled = connected;
        logoutWhatsAppBtn.disabled = !connected;
    }

    // Função para exibir o QR Code
    function displayQR(qrCode) {
        // Limpa o container
        qrContainer.innerHTML = '';
        
        // Cria um novo elemento img para o QR
        const qrImage = document.createElement('img');
        qrImage.src = qrCode;
        qrImage.alt = 'WhatsApp QR Code';
        qrImage.style.maxWidth = '100%';
        qrContainer.appendChild(qrImage);
        
        // Habilita o botão de atualizar
        refreshQrBtn.disabled = false;
    }

    // Eventos do Socket.IO
    socket.on('qr', (qr) => {
        displayQR(qr);
        updateStatus('Aguardando leitura do QR Code...');
    });

    socket.on('ready', () => {
        qrContainer.innerHTML = '<p>WhatsApp Conectado!</p>';
        updateStatus('Conectado', true);
    });

    socket.on('disconnected', () => {
        qrContainer.innerHTML = '<p>Desconectado</p>';
        updateStatus('Desconectado');
    });

    // Event Listeners dos botões
    refreshQrBtn.addEventListener('click', () => {
        qrContainer.innerHTML = '<p>Solicitando novo QR Code...</p>';
        socket.emit('requestQR');
    });

    logoutWhatsAppBtn.addEventListener('click', () => {
        socket.emit('logout');
        updateStatus('Desconectando...');
    });

    // Verificação inicial do status
    socket.emit('checkStatus');
});

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
