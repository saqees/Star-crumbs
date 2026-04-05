const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:4200'];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET','POST'], credentials: true }
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const pushRouter = require('./routes/push');
const { sendToUser, sendToAdmins, broadcastToUsers } = pushRouter;

app.use('/api/auth',           require('./routes/auth'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/products',       require('./routes/products'));
app.use('/api/categories',     require('./routes/categories'));
app.use('/api/cart',           require('./routes/cart'));
app.use('/api/orders',         require('./routes/orders'));
app.use('/api/reviews',        require('./routes/reviews'));
app.use('/api/notifications',  require('./routes/notifications'));
app.use('/api/chat',           require('./routes/chat'));
app.use('/api/upload',         require('./routes/upload'));
app.use('/api/carousel',       require('./routes/carousel'));
app.use('/api/site-settings',  require('./routes/site-settings'));
app.use('/api/site-pages',     require('./routes/site-pages'));
app.use('/api/site-reviews',   require('./routes/site-reviews'));
app.use('/api/combos',         require('./routes/combos'));
app.use('/api/push',           pushRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'OK', time: new Date() }));

// Track online users: userId → socketId
const onlineUsers = new Map();

// Helper: emit a real-time notification to a specific user (if online)
const emitToUser = (userId, event, data) => {
  const sid = onlineUsers.get(userId);
  if (sid) io.to(sid).emit(event, data);
};

// Helper: emit to all admins who are online
const emitToAdmins = async () => {
  try {
    const pool = require('./db');
    const result = await pool.query("SELECT id FROM users WHERE role='admin'");
    return result.rows.map(r => r.id);
  } catch (_) { return []; }
};

// Make helpers available to routes
app.set('io', io);
app.set('emitToUser', emitToUser);
app.set('onlineUsers', onlineUsers);

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

    // Real-time delivery to receiver (if online)
    const receiverSid = onlineUsers.get(receiverId);
    if (receiverSid) {
      io.to(receiverSid).emit('receive_message', {
        senderId, senderName, senderPic, message, timestamp: new Date()
      });
      // In-app + browser notification (receiver is online, page open)
      io.to(receiverSid).emit('star_crumbs_notification', {
        title: `💬 ${senderName || 'Mensaje nuevo'}`,
        body: message.slice(0, 100),
        url: '/profile',
        icon: senderPic || '/icons/icon-192x192.png'
      });
    }

    socket.emit('message_sent', { receiverId, message, timestamp: new Date() });

    // Push notification for offline receivers
    try { await sendToUser(receiverId, { title: `💬 ${senderName || 'Star Crumbs'}`, body: message.slice(0, 80), icon: '/icons/icon-192x192.png', badge: '/icons/badge-72x72.png', url: '/profile' }); } catch (_) {}
  });

  // New order: emit to all online admins
  socket.on('new_order', async (data) => {
    try {
      const adminIds = await emitToAdmins();
      const payload = {
        title: '🛍️ Nuevo pedido recibido',
        body: `${data.username || 'Un usuario'} hizo un pedido de $${(data.total || 0).toLocaleString('es-CO')}`,
        url: '/admin',
        icon: '/icons/icon-192x192.png'
      };
      for (const adminId of adminIds) {
        const sid = onlineUsers.get(adminId);
        if (sid) io.to(sid).emit('star_crumbs_notification', payload);
      }
      await sendToAdmins({ ...payload, badge: '/icons/badge-72x72.png' });
    } catch (_) {}
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-store');
    else if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    else if (filePath.match(/\.(js|css|png|svg|ico|webmanifest)$/)) res.setHeader('Cache-Control', 'public,max-age=86400');
  }
}));
app.use((_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Star Crumbs on port ${PORT}`));
