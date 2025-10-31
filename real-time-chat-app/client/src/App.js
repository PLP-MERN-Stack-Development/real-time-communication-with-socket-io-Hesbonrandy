// client/src/App.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';
import { useTheme } from './ThemeContext';

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
  const { darkMode, toggleDarkMode } = useTheme();

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

  const handleLogin = (name) => {
    setUsername(name);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
  };

  return (
    <div
      className="App"
      style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: darkMode ? '#121212' : '#f5f5f5',
        color: darkMode ? '#fff' : '#000',
        minHeight: '100vh',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>💬 Real-Time Chat App</h1>

        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleDarkMode}
          style={{
            marginLeft: '10px',
            padding: '6px 12px',
            backgroundColor: darkMode ? '#ffc107' : '#212529',
            color: darkMode ? '#212529' : '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '1.1em' }}>
        Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </p>

      {!isLoggedIn ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <Login onLogin={handleLogin} />
        </div>
      ) : (
        <Chat username={username} socket={socket} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
