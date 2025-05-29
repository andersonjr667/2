require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

// Update the WhatsApp import
const whatsapp = require('./whatsapp');
const routes = require('./routes');
const { scheduleNotifications } = require('./utils/notifications');
const Log = require('./models/Log');
const User = require('./models/User');
const { auth, adminOnly, requireRole } = require('./utils/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const port = process.env.PORT || 3000;

// Console colors
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m"
};

// Função para mostrar o banner do sistema
function showBanner() {
    const version = require('./package.json').version;
    console.clear();
    console.log(`${colors.magenta}${colors.bright}
    ╔════════════════════════════════════╗
    ║        Sistema de Gestão dos       ║
    ║         Visitantes da Igreja       ║
    ║                                    ║
    ║              Boa Parte             ║
    ║          Versão ${version}              ║
    ╚════════════════════════════════════╝${colors.reset}
    `);
}

// Função para mostrar status do servidor
function logServerStatus() {
    console.log(`${colors.green}✓ Servidor rodando:${colors.reset}`);
    console.log(`  └─ Local:   ${colors.cyan}http://localhost:${port}${colors.reset}`);
    console.log(`  └─ Modo:    ${colors.cyan}${process.env.NODE_ENV || 'development'}${colors.reset}`);
    console.log(`  └─ MongoDB: ${colors.cyan}Conectado${colors.reset}\n`);
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Servir arquivos estáticos da pasta db para acesso via frontend
app.use('/db', express.static(path.join(__dirname, 'db')));

// Request logging middleware
app.use(async (req, res, next) => {
    const start = Date.now();
    res.on('finish', async () => {
        const duration = Date.now() - start;
        if (duration > 1000) { // Log requests that take more than 1 second
            await Log.logAction({
                type: 'system',
                action: 'slow_request',
                description: `Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`,
                username: req.userData?.username || req.userData?.email || 'anonymous'
            });
        }
    });
    next();
});

// Socket.IO setup
io.on('connection', (socket) => {
    console.log(`${colors.dim}🔌 Cliente conectado: ${socket.id}${colors.reset}`);

    socket.on('disconnect', () => {
        console.log(`${colors.dim}🔌 Cliente desconectado: ${socket.id}${colors.reset}`);
    });
});

// Make io accessible
app.set('io', io);

// Session version control
const sessionVersionPath = path.join(__dirname, 'session_version.json');
let sessionVersion = 1;
try {
    if (fs.existsSync(sessionVersionPath)) {
        const data = JSON.parse(fs.readFileSync(sessionVersionPath, 'utf8'));
        sessionVersion = (data.version || 1) + 1;
    }
    fs.writeFileSync(sessionVersionPath, JSON.stringify({ version: sessionVersion }, null, 2));
    console.log(colors.yellow + `Sessão versão: ${sessionVersion}` + colors.reset);
} catch (err) {
    console.error(colors.red + 'Erro ao ler/incrementar session_version.json:' + colors.reset, err);
}

// Tornar a versão disponível globalmente
app.set('sessionVersion', sessionVersion);

// API Routes
app.use('/api', routes);

// Serve static files and handle SPA routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use(async (err, req, res, next) => {
    console.error('Server error:', err);

    // Log server errors
    await Log.logAction({
        type: 'system',
        action: 'server_error',
        description: err.message,
        username: req.userData?.email || 'system',
        details: {
            stack: err.stack,
            path: req.originalUrl,
            method: req.method
        }
    });

    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production' 
            ? 'Erro interno do servidor' 
            : err.message
    });
});

// No seu servidor
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com"
    );
    next();
});

// Connect to MongoDB and start server
async function startServer() {
    try {
        showBanner();
        console.log(`${colors.yellow}⌛ Conectando ao MongoDB...${colors.reset}`);
        
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'boaparte', // Nome específico do banco
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4
        });

        // Listen on all interfaces with new configuration
        const host = '0.0.0.0';
        server.listen(port, host, () => {
            const networkInterfaces = require('os').networkInterfaces();
            console.log(`${colors.green}✓ Servidor rodando em:${colors.reset}`);
            console.log(`  └─ Local:   ${colors.cyan}http://localhost:${port}${colors.reset}`);
            
            // Show all available network interfaces
            Object.keys(networkInterfaces).forEach((interfaceName) => {
                const interfaces = networkInterfaces[interfaceName];
                interfaces.forEach((interface) => {
                    if (interface.family === 'IPv4' && !interface.internal) {
                        console.log(`  └─ Rede:    ${colors.cyan}http://${interface.address}:${port}${colors.reset}`);
                    }
                });
            });
            
            console.log(`  └─ Modo:    ${colors.cyan}${process.env.NODE_ENV || 'development'}${colors.reset}`);
            console.log(`  └─ MongoDB: ${colors.cyan}Conectado${colors.reset}\n`);
            
            scheduleNotifications();
        });

        whatsapp.setupWhatsApp(io);
    } catch (error) {
        console.error(`${colors.red}❌ Erro ao iniciar servidor:${colors.reset}`, error);
        // Mostra stack trace detalhado
        if (error && error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Error handlers
process.on('uncaughtException', async (err) => {
    console.error(`${colors.red}❌ Erro não tratado:${colors.reset}`, err);
    await Log.logError(err, { level: 'critical', source: 'system' });
    process.exit(1);
});

process.on('unhandledRejection', async (err) => {
    console.error(`${colors.red}❌ Promise rejeitada:${colors.reset}`, err);
    await Log.logError(err, { level: 'critical', source: 'system' });
});

// Start the server
startServer();
