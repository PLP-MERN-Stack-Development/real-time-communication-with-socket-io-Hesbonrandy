# Real-Time Chat Application

A feature-rich real-time chat application built with Socket.io, React, and Express that enables seamless communication between users.

## Features

### Core Functionality
- 🔐 Simple username-based authentication
- 💬 Real-time global chat messaging
- 👥 Online user status tracking
- 🕒 Message timestamps and delivery confirmation
- 📍 Typing indicators
- 🌓 Dark/Light theme support

### Advanced Features
- 📱 Responsive design for mobile and desktop
- 📨 Private messaging between users
- 📎 File sharing support (images, PDFs, docs)
- 🔔 Desktop notifications for new messages
- 🔄 Automatic reconnection handling
- 🔍 Message search functionality
- ✅ Message delivery acknowledgments
- 🔊 Sound notifications for new messages

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.io
- **Styling**: CSS-in-JS

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd real-time-chat-app
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

### Running the Application

1. Start the server:
```bash
cd server
npm run dev
```

2. Start the client in a new terminal:
```bash
cd client
npm start
```

3. Access the application at http://localhost:3000

## Usage

1. Enter your username to join the chat
2. Send messages in the global chat
3. Click on an online user to start a private conversation
4. Use the file upload button to share files
5. Toggle dark/light theme using the theme switch
6. Search messages using the search input
7. Desktop notifications will appear for new messages when the window is not focused

## Screenshots

### 1. Logged-In Dashboard (Light Mode)
![Logged-In Dashboard](./screenshots/logged-in-dashboard.png)

> Shows successful connection, welcome message, and online user count.

### 2. Light Theme Interface
![Light Theme](./screenshots/light-theme.png)

> Clean, modern UI with green connected status indicator.

### 3. Dark Theme Interface
![Dark Theme](./screenshots/dark-theme.png)

> Toggleable dark mode with high contrast for night-time use.

## Project Structure

```
real-time-chat-app/
├── client/                 # React frontend
│   ├── public/            
│   └── src/               
│       ├── components/    
│       │   ├── Chat.js    
│       │   └── Login.js   
│       ├── App.js         
│       └── ThemeContext.js
└── server/                # Node.js backend
    ├── package.json      
    └── server.js         
```

## API Documentation

### Socket Events

#### Client to Server:
- `user_join`: Join the chat with username
- `send_message`: Send a message
- `send_file`: Share a file
- `private_message`: Send private message
- `typing`: Indicate user is typing
- `stop_typing`: Indicate user stopped typing

#### Server to Client:
- `receive_message`: Broadcast received message
- `receive_file`: Broadcast shared file
- `private_message`: Deliver private message
- `user_status`: Update online users list
- `user_typing`: Show typing indicator

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License

## Acknowledgments

- Socket.io team for the excellent real-time engine
- React team for the frontend framework
- Express.js team for the backend framework