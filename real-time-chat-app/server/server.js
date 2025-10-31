// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: "http://localhost:3000"
}));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // React dev server
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Store online users
const users = {}; // socket.id => username

// Basic route
app.get('/', (req, res) => {
  res.send('Chat Server is running!');
});

io.engine.on('initial_headers', (headers, req) => {
  console.log('🔌 WebSocket handshake from:', req.headers.origin);
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // When a user joins
  socket.on('user_join', ({ username }) => {
    users[socket.id] = username;
    socket.username = username;
    console.log(`${username} joined the chat`);

    // Notify others
    socket.broadcast.emit('user_joined', { username });

    // Broadcast updated online users
    io.emit('user_status', { users: Object.values(users) });
  });

  // When a user sends a message (with acknowledgment)
  socket.on('send_message', (data, callback) => {
    const messageData = {
      username: socket.username,
      text: data.text,
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Broadcast message to all users (including sender)
    io.emit('receive_message', messageData);

    // Acknowledge receipt back to the sender
    if (callback) callback({ received: true });
  });

  // When a user sends a file (with acknowledgment)
  socket.on('send_file', (data, callback) => {
    const fileData = {
      username: socket.username,
      fileName: data.fileName,
      fileType: data.fileType,
      fileContent: data.fileContent,
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Broadcast the file to all clients
    io.emit('receive_file', fileData);

    // Confirm receipt to sender
    if (callback) callback({ received: true });
  });

  // Private messages
  socket.on('private_message', ({ to, text }, callback) => {
  const recipientSocketId = Object.keys(users).find((id) => users[id] === to);

  if (recipientSocketId) {
    const msg = {
      from: socket.username,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.to(recipientSocketId).emit('private_message', msg);
    socket.emit('private_message', { ...msg, self: true, to });

    if (callback) callback({ received: true }); // ✅ Acknowledge
  } else {
    if (callback) callback({ received: false, error: 'User not online' });
  }
});

  // Typing indicators
  socket.on('typing', ({ username }) => {
    socket.broadcast.emit('user_typing', { username });
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('user_stop_typing');
  });

  // Room joining
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`${socket.username} joined room: ${room}`);
  });

  // Room messages
  socket.on('room_message', ({ room, message }) => {
    const roomMessage = {
      username: socket.username,
      message,
      time: new Date().toISOString(),
    };
    io.to(room).emit('room_message', roomMessage);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      console.log(`${users[socket.id]} disconnected`);
      delete users[socket.id];

      // Update online users list
      io.emit('user_status', { users: Object.values(users) });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
