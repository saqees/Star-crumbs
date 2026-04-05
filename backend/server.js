const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:4200'];

// ═══════════════════════════════════════════════
// SECURITY HEADERS (Helmet)
// ═══════════════════════════════════════════════
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", ...allowedOrigins, 'wss:', 'ws:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    }
  },
  crossOriginEmbedderPolicy: false,
}));

// ═══════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════
// Global limit — 300 req/15min per IP
const globalLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }
});

// Strict limit for auth endpoints — 10 attempts/15min
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.' }
});

// API limit — 100 req/min
const apiLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Límite de API alcanzado. Espera un momento.' }
});

app.use(globalLimit);

// ═══════════════════════════════════════════════
// CORS
// ═══════════════════════════════════════════════
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ═══════════════════════════════════════════════
// HTTPS REDIRECT in production
// ═══════════════════════════════════════════════
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
      return res.redirect(301, 'https://' + req.headers.host + req.url);
    }
    next();
  });
}

// ═══════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════
const pushRouter = require('./routes/push');
const { sendToUser, sendToAdmins, broadcastToUsers } = pushRouter;

app.use('/api/auth',           authLimit, require('./routes/auth'));
app.use('/api/users',          apiLimit, require('./routes/users'));
app.use('/api/products',       apiLimit, require('./routes/products'));
app.use('/api/categories',     apiLimit, require('./routes/categories'));
app.use('/api/cart',           apiLimit, require('./routes/cart'));
app.use('/api/orders',         apiLimit, require('./routes/orders'));
app.use('/api/reviews',        apiLimit, require('./routes/reviews'));
app.use('/api/notifications',  apiLimit, require('./routes/notifications'));
app.use('/api/chat',           apiLimit, require('./routes/chat'));
app.use('/api/upload',         apiLimit, require('./routes/upload'));
app.use('/api/carousel',       apiLimit, require('./routes/carousel'));
app.use('/api/site-settings',  apiLimit, require('./routes/site-settings'));
app.use('/api/site-pages',     apiLimit, require('./routes/site-pages'));
app.use('/api/site-reviews',   apiLimit, require('./routes/site-reviews'));
app.use('/api/combos',         apiLimit, require('./routes/combos'));
app.use('/api/push',           apiLimit, pushRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'OK', time: new Date() }));

// ═══════════════════════════════════════════════
// SOCKET.IO — Real-time notifications
// ═══════════════════════════════════════════════
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('user_connected', (userId) => {
    if (!userId || typeof userId !== 'string') return;
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('send_message', async (data) => {
    const { receiverId, message, senderId, senderName, senderPic } = data;
    if (!receiverId || !message) return;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('receive_message', { senderId, senderName, senderPic, message, timestamp: new Date() });
    }
    socket.emit('message_sent', { receiverId, message, timestamp: new Date() });
    // Real-time in-app notification to receiver
    if (receiverSocket) {
      io.to(receiverSocket).emit('in_app_notification', {
        type: 'message',
        title: `Mensaje de ${senderName || 'Star Crumbs'}`,
        body: message.slice(0, 80),
        icon: '💬',
        url: '/profile'
      });
    }
    // Push to offline user
    try { await sendToUser(receiverId, { title: `💬 ${senderName || 'Star Crumbs'}`, body: message.slice(0, 80), icon: senderPic || '/icons/icon-192x192.png', badge: '/icons/badge-72x72.png', url: '/profile' }); } catch (_) {}
  });

  // Broadcast in-app notification to all connected admins
  socket.on('new_order', async (data) => {
    for (const [uid, sid] of onlineUsers) {
      io.to(sid).emit('in_app_notification_admin', {
        type: 'order',
        title: '🛍️ Nuevo pedido',
        body: `${data.username || 'Un usuario'} realizó un pedido`,
        url: '/admin',
        icon: '🛍️'
      });
    }
    try { await sendToAdmins({ title: '🛍️ Nuevo pedido recibido', body: `${data.username || 'Un usuario'} realizó un pedido`, icon: '/icons/icon-192x192.png', badge: '/icons/badge-72x72.png', url: '/admin' }); } catch (_) {}
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

app.set('io', io);
app.set('sendToUser', sendToUser);
app.set('sendToAdmins', sendToAdmins);
app.set('broadcastToUsers', broadcastToUsers);

// ═══════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message;
  res.status(status).json({ message });
});

// ═══════════════════════════════════════════════
// STATIC + SPA FALLBACK
// ═══════════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    // Cache static assets
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    // No cache for html
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
    // Service worker must not be cached
    if (filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Star Crumbs API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
