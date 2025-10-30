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

  // When a user sends a private message
  socket.on('private_message', ({ to, text }) => {

    // Find socket ID of recipient
    const recipientSocketId = Object.keys(users).find(id => users[id] === to);
    
    if (recipientSocketId) {
      // Send to the recipient
      socket.to(recipientSocketId).emit('private_message', {
        from: socket.username,
        text,    
        time: new Date().toISOString() // Using ISOString for consistency
      });
      
      // Also send to sender for UI confirmation
      socket.emit('private_message', {
        from: socket.username,
        to,
        text,
        self: true,
        time: new Date().toISOString() // Using ISOString for consistency
      });
    }
  });
   // User typing events
  socket.on('typing', ({ username }) => {
    socket.broadcast.emit('user_typing', { username });
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('user_stop_typing');
  });

   // Join a specific room
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`${socket.username} joined room: ${room}`);
  });

  // Send message to a specific room
  socket.on('room_message', ({ room, message }) => {
    const roomMessage = {
      username: socket.username,
      message,
      time: new Date().toISOString(),
    };
    io.to(room).emit('room_message', roomMessage);
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

