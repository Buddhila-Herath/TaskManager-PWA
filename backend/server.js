require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager';

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('authenticate', (token) => {
    if (!token) {
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userRoom = `user:${decoded.id}`;
      socket.join(userRoom);
      console.log(`Socket ${socket.id} joined room ${userRoom}`);
    } catch (err) {
      console.warn('Socket authentication failed:', err.message);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.warn('MongoDB connection failed (optional):', err.message);
  });

server.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
