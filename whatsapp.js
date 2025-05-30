const express = require('express');
const router = express.Router();
const venom = require('venom-bot');
const { auth } = require('./utils/auth');
const Log = require('./models/Log');

let client = null;
let qrCallback = null;
let connectionRetries = 0;
const MAX_RETRIES = 3;

// Initialize WhatsApp client
async function initializeWhatsApp(socket) {
    try {
        qrCallback = socket;
        
        if (!client) {
            client = await venom.create({
                session: 'boa-parte-session',
                multidevice: true,
                headless: true,
                useChrome: false,
                debug: false,
                logQR: false,
                disableWelcome: true,
                createPathFileToken: true,
                waitForLogin: true
            },
            (base64Qr) => {
                if (socket && base64Qr) {
                    socket.emit('qr', base64Qr);
                }
            },
            (statusFind) => {
                console.log('Status:', statusFind);
                if (statusFind === 'isLogged') {
                    socket.emit('ready');
                }
            },
            {
                folderNameToken: 'tokens',
                headless: 'new'
            });

            client.onStateChange((state) => {
                console.log('State changed:', state);
                if (state === 'CONNECTED') {
                    socket.emit('ready');
                }
                if (state === 'DISCONNECTED') {
                    socket.emit('disconnected');
                    client = null;
                }
            });
        }

        return client;
    } catch (error) {
        console.error('Error initializing WhatsApp:', error);
        socket.emit('error', error.message);
        throw error;
    }
}

// Log WhatsApp event
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
