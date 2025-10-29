// client/src/App.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';

const socket = io('http://localhost:5000');

function App() {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Monitor socket connection status
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
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
