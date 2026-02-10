const io = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const TEST_JWT = process.env.TEST_JWT;

const socket = io(BACKEND_URL, {
  transports: ['websocket'],
});

console.log('Connecting to WebSocket server at', BACKEND_URL, '...');

socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);

  if (!TEST_JWT) {
    console.warn(
      'No TEST_JWT env var set. Set TEST_JWT to a valid JWT before running this script to join the user room.'
    );
    return;
  }

  console.log('Sending authenticate event with JWT...');
  socket.emit('authenticate', TEST_JWT);
});

socket.on('auth_error', (data) => {
  console.log('[EVENT] auth_error:', data);
});

socket.on('task_created', (data) => {
  console.log('[EVENT] task_created:', data);
});

socket.on('task_updated', (data) => {
  console.log('[EVENT] task_updated:', data);
});

socket.on('task_deleted', (data) => {
  console.log('[EVENT] task_deleted:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Keep the script running
setInterval(() => {}, 1000);
