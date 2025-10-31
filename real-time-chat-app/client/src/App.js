// client/src/App.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';

// Create a single socket instance
const socket = io('http://localhost:5000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

function App() {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Handle socket connection status
  useEffect(() => {
    const handleConnect = () => {
      console.log('✅ Connected to server:', socket.id);
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Disconnected from server');
      setConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Cleanup: remove listeners only (do NOT disconnect socket here)
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Emit 'user_join' when username is set
  useEffect(() => {
    if (username) {
      socket.emit('user_join', { username });
      setIsLoggedIn(true);
    }
  }, [username]);

  // Handle login from Login component
  const handleLogin = (name) => {
    setUsername(name);
  };

  // Handle logout from Chat component
  const handleLogout = () => {
    // Clean up state — socket.disconnect() is called inside Chat
    setIsLoggedIn(false);
    setUsername('');
  };

  return (
    <div className="App" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Real-Time Chat App</h1>
      <p style={{ textAlign: 'center', fontSize: '1.1em' }}>
        Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </p>

      {!isLoggedIn ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <Login onLogin={handleLogin} />
        </div>
      ) : (
        <Chat 
          username={username} 
          socket={socket} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}

export default App;