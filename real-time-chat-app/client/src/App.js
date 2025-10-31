// client/src/App.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';
import './index.css'

const socket = io('http://localhost:5000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

function App() {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Monitor socket connection status
   useEffect(() => {
    const handleConnect = () => {
      console.log('Connected to server:', socket.id);
      setConnected(true);
    };

     const handleDisconnect = () => {
    setConnected(false);
  };

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);

    return () => {
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
  };
}, []);

  // When username is set (after login), notify the server
  useEffect(() => {
    if (username) {
      socket.emit('user_join', { username });
      setIsLoggedIn(true);
    }
  }, [username]);

  // Handle login (triggered by Login component)
  const handleLogin = (name) => {
    setUsername(name);
  };

  return (
    <div className="App">
      <h1>Real-Time Chat App</h1>
      <p>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>

      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Chat username={username} socket={socket} />
      )}
    </div>
  );
}

export default App;
