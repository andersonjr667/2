const Member = require('../models/Member');
const Contact = require('../models/Contact');
const MessageStatus = require('../models/MessageStatus');
const Log = require('../models/Log');
const { create } = require('venom-bot');

let whatsappClient = null;

async function handleMessageStatus(message) {
    try {
        const status = message.ack; // 0: sent, 1: delivered, 2: read
        const statusMap = {
            0: 'sent',
            1: 'delivered',
            2: 'read'
        };

        if (status && message.id) {
            await MessageStatus.findOneAndUpdate(
                { messageId: message.id },
                { 
                    status: statusMap[status],
                    ...(status === 1 ? { deliveredAt: new Date() } : {}),
                    ...(status === 2 ? { readAt: new Date() } : {})
                }
            );
        }
    } catch (error) {
        console.error('Error handling message status:', error);
    }
}

async function sendMessage(recipient, message, type = 'custom') {
    try {
        if (!whatsappClient) {
            throw new Error('WhatsApp client not initialized');
        }

        // Clean and format phone number
        const phone = recipient.phone.replace(/\D/g, '');
        const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;

        // Create log entry
        const log = await Log.create({
            type: 'message',
            action: 'send_whatsapp',
            level: 'info',
            source: 'whatsapp',
            description: `Sending message to ${recipient.name}`,
            username: 'system',
            details: {
                messageType: type,
                name: recipient.name,
                phone: formattedPhone,
                messageLength: message.length
            }
        });

        // Create message status entry
        const messageStatus = await MessageStatus.create({
            messageId: log._id,
            recipientId: recipient._id,
            recipientType: recipient.constructor.modelName,
            phone: formattedPhone,
            status: 'queued'
        });

        // Send message with retry mechanism
        const result = await sendMessageWithRetry(formattedPhone, message);

        // Update status
        await messageStatus.updateStatus('sent');
        await Log.logEvent('message_sent', 'info', `Message sent successfully to ${recipient.name}`);

        return { success: true, messageId: log._id };
    } catch (error) {
        await Log.logError(error, {
            level: 'error',
            source: 'whatsapp',
            username: 'system',
            metadata: {
                recipientName: recipient.name,
                recipientPhone: recipient.phone,
                messageType: type
            }
        });
        throw error;
    }
}

async function notifyAbsentMembers() {
    try {
        const absentMembers = await Member.find({
            'attendance.lastAttendance': {
                $lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            },
            'notificationPreferences.whatsapp': true,
            'status': 'ativo'
        });

        for (const member of absentMembers) {
            const message = `Olá ${member.name},\n\n` +
                          `Sentimos sua falta em nossa igreja. Não o vemos há algumas semanas ` +
                          `e gostaríamos de saber se está tudo bem.\n\n` +
                          `Se precisar de apoio ou oração, estamos aqui para você.\n\n` +
                          `Que Deus abençoe!`;

            try {
                await sendMessage(member, message, 'absence');
            } catch (err) {
                console.error(`Error sending notification to ${member.name}:`, err);
            }
        }
    } catch (error) {
        console.error('Error in notifyAbsentMembers:', error);
    }
}

function scheduleNotifications() {
    const now = new Date();
    const nextRun = new Date();
    
    // Run every Sunday at 8 PM
    nextRun.setDate(now.getDate() + (7 - now.getDay()));
    nextRun.setHours(20, 0, 0, 0);

    if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
    }

    const timeUntilNextRun = nextRun - now;
    setTimeout(() => {
        notifyAbsentMembers();
        scheduleNotifications(); // Schedule next run
    }, timeUntilNextRun);
}

// Retry failed messages
async function retryFailedMessages() {
    try {
        const failedMessages = await MessageStatus.findPendingMessages(10);
        
        for (const message of failedMessages) {
            const recipient = await (message.recipientType === 'Member' ? 
                Member.findById(message.recipientId) : 
                Contact.findById(message.recipientId));

            if (!recipient) continue;

            try {
                await sendMessage(recipient, message.content, 'retry');
            } catch (error) {
                console.error(`Failed to retry message ${message._id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error retrying failed messages:', error);
    }
}

// Schedule retry of failed messages every hour
setInterval(retryFailedMessages, 60 * 60 * 1000);

module.exports = {
    sendMessage,
    notifyAbsentMembers,
    scheduleNotifications,
    retryFailedMessages
};
