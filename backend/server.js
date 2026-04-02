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

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/categories',    require('./routes/categories'));
app.use('/api/cart',          require('./routes/cart'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat',          require('./routes/chat'));
app.use('/api/upload',        require('./routes/upload'));

// Health
app.get('/api/health', (_req, res) => res.json({ status: 'OK', time: new Date() }));

// ─── Socket.io ─────────────────────────────────────────────
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('user_connected', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('send_message', (data) => {
    const { receiverId, message, senderId, senderName, senderPic } = data;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('receive_message', {
        senderId,
        senderName,
        senderPic,
        message,
        timestamp: new Date()
      });
    }
    // Always bounce back to sender for confirmation
    socket.emit('message_sent', { receiverId, message, timestamp: new Date() });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

// ─── Static (Angular build) ────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Star Crumbs API running on port ${PORT}`));
