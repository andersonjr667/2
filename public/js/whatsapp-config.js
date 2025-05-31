// WhatsApp Configuration Page

document.addEventListener('DOMContentLoaded', () => {
    // Estabelece conexão com Socket.IO
    // Usa o host atual para evitar problemas de ambiente
    const socket = io(window.location.origin);

    // Elementos do DOM
    const qrContainer = document.getElementById('qrContainer');
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    const qrLoadingSpinner = document.getElementById('qrLoadingSpinner');
    const qrError = document.getElementById('qrError');
    const connectionStatus = document.getElementById('connectionStatus');
    const statusText = document.querySelector('.status-text');
    const statusDesc = document.querySelector('.status-desc');
    const refreshQrBtn = document.getElementById('refreshQrBtn');
    const logoutWhatsAppBtn = document.getElementById('logoutWhatsAppBtn');

    // Função para atualizar o status da conexão
    function updateStatus(status, connected = false, error = false) {
        statusText.textContent = status;
        statusDesc.textContent = `Status: ${status}`;
        connectionStatus.classList.toggle('connected', connected);
        connectionStatus.setAttribute('aria-label', `Status: ${status}`);
        refreshQrBtn.disabled = connected || error;
        logoutWhatsAppBtn.disabled = !connected || error;
        if (error) {
            connectionStatus.classList.add('error');
        } else {
            connectionStatus.classList.remove('error');
        }
    }

    // Função para exibir o QR Code
    function displayQR(qrCode) {
        // Oculta placeholder e spinner
        if (qrPlaceholder) qrPlaceholder.style.display = 'none';
        if (qrLoadingSpinner) qrLoadingSpinner.style.display = 'none';
        if (qrError) qrError.style.display = 'none';
        // Limpa o container
        qrContainer.innerHTML = '';
        // Cria um novo elemento img para o QR
        const qrImage = document.createElement('img');
        qrImage.src = qrCode;
        qrImage.alt = 'WhatsApp QR Code';
        qrImage.style.maxWidth = '100%';
        qrImage.classList.add('qr-fade-in');
        qrContainer.appendChild(qrImage);
        refreshQrBtn.disabled = false;
        // Debug: log para garantir que o QR chegou
        console.log('QR code recebido e exibido.');
    }

    // Função para exibir erro
    function showError(message) {
        qrError.textContent = message;
        qrError.style.display = 'block';
        qrLoadingSpinner.style.display = 'none';
        updateStatus('Erro', false, true);
    }

    // Eventos do Socket.IO
    socket.on('qr', (qr) => {
        console.log('FRONTEND: Evento qr recebido do backend');
        displayQR(qr);
        updateStatus('Aguardando leitura do QR Code...');
    });

    socket.on('ready', () => {
        qrContainer.innerHTML = '<p>WhatsApp Conectado!</p>';
        qrError.style.display = 'none';
        updateStatus('Conectado', true);
    });

    socket.on('disconnected', () => {
        qrContainer.innerHTML = '<p>Desconectado</p>';
        qrError.style.display = 'none';
        updateStatus('Desconectado');
    });

    socket.on('qr_error', (msg) => {
        showError(msg || 'Erro ao gerar QR Code. Tente novamente.');
    });

    // Reconexão automática
    socket.on('disconnect', () => {
        updateStatus('Desconectado');
        setTimeout(() => socket.connect(), 2000);
    });
    socket.on('connect_error', () => {
        showError('Erro de conexão com o servidor. Tentando reconectar...');
        setTimeout(() => socket.connect(), 3000);
    });

    // Event Listeners dos botões
    refreshQrBtn.addEventListener('click', () => {
        qrContainer.innerHTML = '';
        qrLoadingSpinner.style.display = 'block';
        qrError.style.display = 'none';
        socket.emit('requestQR');
    });

    logoutWhatsAppBtn.addEventListener('click', () => {
        socket.emit('logout');
        updateStatus('Desconectando...');
    });

    // Verificação inicial do status
    qrLoadingSpinner.style.display = 'block';
    socket.emit('checkStatus');

    // Atualização automática do status a cada 10s
    setInterval(() => {
        socket.emit('checkStatus');
    }, 10000);
});

// Sidebar/menu overlay (acessibilidade e mobile)
document.addEventListener('DOMContentLoaded', () => {
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const menuOverlay = document.querySelector('.menu-overlay');
  function toggleSidebar() {
    sidebar.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    if (sidebar.classList.contains('active')) {
      sidebar.focus();
    }
  }
  if (sidebarToggle && sidebar && menuOverlay) {
    sidebarToggle.addEventListener('click', toggleSidebar);
    menuOverlay.addEventListener('click', toggleSidebar);
  }
});
