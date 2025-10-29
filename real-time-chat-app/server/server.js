// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // React dev server
    methods: ["GET", "POST"]
  }
});

// Store online users
const users = {}; // socket.id => username

// Basic route
app.get('/', (req, res) => {
  res.send('Chat Server is running!');
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // When a user joins
  socket.on('user_join', ({ username }) => {
    users[socket.id] = username;
    socket.username = username;
    console.log(`${username} joined the chat`);

    // Broadcast updated online users
    io.emit('user_status', { users: Object.values(users) });
  });

  // When a user sends a message
  socket.on('send_message', (data) => {
    const messageData = {
      username: socket.username,     // Sender's username
      message: data.message,         // Message content
      timestamp: new Date().toISOString() // Optional timestamp
    };

    // Broadcast message to all clients
    io.emit('receive_message', messageData);
  });

   // User typing events
  socket.on('typing', ({ username }) => {
    socket.broadcast.emit('user_typing', { username });
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('user_stop_typing');
  });

  // When a user disconnects
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      console.log(`${users[socket.id]} disconnected`);
      delete users[socket.id];

      // Broadcast updated online users
      io.emit('user_status', { users: Object.values(users) });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
