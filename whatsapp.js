const express = require('express');
const router = express.Router();
const { create } = require('venom-bot');
const { auth } = require('./utils/auth');
const Log = require('./models/Log');
const puppeteer = require('puppeteer');

let client = null;
let qrCode = null;
let connectionRetries = 0;
const MAX_RETRIES = 3;
let chromiumExecutablePath = null;

(async () => {
    try {
        const browserFetcher = puppeteer.createBrowserFetcher();
        const localRevisions = await browserFetcher.localRevisions();
        if (localRevisions.length > 0) {
            const revisionInfo = await browserFetcher.revisionInfo(localRevisions[0]);
            chromiumExecutablePath = revisionInfo.executablePath;
        }
    } catch (e) {
        console.warn('Não foi possível detectar o caminho do Chromium:', e);
    }
})();

async function logWhatsAppEvent(action, level = 'info', description = '', error = null) {
    try {
        await Log.create({
            type: 'system',
            action,
            level,
            source: 'whatsapp',
            description,
            username: 'system',
            errorCode: error?.code,
            stackTrace: error?.stack
        });
    } catch (err) {
        console.error('Failed to log WhatsApp event:', err);
    }
}

// Initialize WhatsApp client
async function initializeWhatsApp(ioInstance) {
    try {
        if (connectionRetries >= MAX_RETRIES) return;

        // Adicione executablePath se disponível
        const venomOptions = {
            session: 'church-system',
            headless: 'new',
            useChrome: true,
            debug: false,
            logQR: true,
            disableWelcome: true,
            browserArgs: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-notifications',
                '--disable-extensions',
                '--disable-popup-blocking'
            ]
        };
        if (chromiumExecutablePath) {
            venomOptions.executablePath = chromiumExecutablePath;
        }

        const client = await create(venomOptions);

        // Reset retries on successful connection
        connectionRetries = 0;
        
        // Log successful connection
        await logWhatsAppEvent('client_initialized', 'info', 'WhatsApp client initialized successfully');
        
        return client;
    } catch (error) {
        await logWhatsAppEvent('initialization_error', 'error', 'Failed to initialize WhatsApp client', error);
        connectionRetries++;
        
        // Add delay before retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return initializeWhatsApp(ioInstance);
    }
}

// Start initialization
initializeWhatsApp();

// Improved message sending with retry mechanism
async function sendMessageWithRetry(number, message, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            if (!client) {
                throw new Error('WhatsApp client not initialized');
            }

            const formattedNumber = number.replace(/\D/g, '');
            const whatsappNumber = formattedNumber.startsWith('55') ? 
                formattedNumber : `55${formattedNumber}`;

            const result = await client.sendText(`${whatsappNumber}@c.us`, message);
            
            await logWhatsAppEvent('message_sent', 'info', 
                `Message sent successfully to ${whatsappNumber}`);
            
            return result;
        } catch (error) {
            await logWhatsAppEvent('message_failed', 'error',
                `Failed to send message. Attempt ${i + 1}/${retries}`, error);

            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

// Send message route
router.post('/', auth, async (req, res) => {
    try {
        const { number, message } = req.body;
        await sendMessageWithRetry(number, message);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        await logWhatsAppEvent('send_message_error', 'error', 
            'Failed to send message through API', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
});

// Get connection status
router.get('/status', auth, (req, res) => {
  res.json({ connected: !!client });
});

// Create setupWhatsApp function
function setupWhatsApp(ioInstance) {
    if (!ioInstance) {
        console.error('Socket.IO instance not provided');
        return;
    }

    initializeWhatsApp(ioInstance).then(whatsappClient => {
        client = whatsappClient;

        if (client) {
            client.onMessage((message) => {
                console.log('📩 Nova mensagem:', message.body);
                if (ioInstance) ioInstance.emit('whatsapp:message', message);
            });

            client.onStateChange((state) => {
                console.log('🔄 Estado:', state);
                if (ioInstance) ioInstance.emit('whatsapp:state', state);
            });
        }
    });
}

// Cleanup on process exit
process.on('SIGINT', async () => {
  if (client) {
    console.log('📱 Desconectando WhatsApp...');
    await client.close();
  }
  process.exit();
});

// Change module.exports to export both router and setupWhatsApp properly
module.exports = {
    router: router, // Export the router explicitly
    setupWhatsApp: setupWhatsApp
};
