import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ username, socket }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Listen for incoming messages
  useEffect(() => {
    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);

      // Play notification sound for messages from others
      if (!msg.self) {
        const notificationSound = new Audio('/message.mp3');
        notificationSound.play().catch(err => console.warn("Audio play error:", err));
      }

      // Browser notification
      if (!msg.self && Notification.permission === 'granted') {
        new Notification('New message!', { body: `${msg.username}: ${msg.text}` });
      }
    });

    socket.on('receive_file', (msg) => {
      setMessages((prev) => [...prev, msg]);

      if (!msg.self) {
        const notificationSound = new Audio('/message.mp3');
        notificationSound.play().catch(err => console.warn("Audio play error:", err));
      }

      if (!msg.self && Notification.permission === 'granted') {
        new Notification('New file received!', { body: `${msg.username} sent: ${msg.fileName}` });
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('receive_file');
    };
  }, [socket]);

  // Listen for typing events
  useEffect(() => {
    socket.on('user_typing', () => {
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1500);
    });

    socket.on('user_stop_typing', () => {
      setIsTyping(false);
    });

    return () => {
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket]);

  // Listen for online users
  useEffect(() => {
    socket.on('user_status', ({ users }) => {
      setOnlineUsers(users);
    });
    return () => socket.off('user_status');
  }, [socket]);

  // Handle connection and reconnection
  useEffect(() => {
    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      alert('Connection lost. Please check your network.');
    });

    socket.on('reconnect', () => {
      console.log('Reconnected to server');
      socket.emit('user_join', { username });
    });

    return () => {
      socket.off('connect_error');
      socket.off('reconnect');
    };
  }, [socket, username]);

  // Handle sending a text message with acknowledgment
  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const messageData = {
        username,
        text: input,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Emit with acknowledgment callback
      socket.emit('send_message', messageData, (ack) => {
        if (ack?.received) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.time === messageData.time && msg.username === username
                ? { ...msg, status: 'delivered' }
                : msg
            )
          );
        }
      });

      // Add locally with pending status
      setMessages((prev) => [...prev, { ...messageData, self: true, status: 'sent' }]);
      setInput('');
    }
  };

  // Handle typing
  const handleTyping = () => {
    socket.emit('typing', { username });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing');
    }, 1000);
  };

  // Handle file uploads with acknowledgment
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = {
        username,
        fileName: file.name,
        fileType: file.type,
        fileContent: reader.result,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Emit with acknowledgment callback
      socket.emit('send_file', fileData, (ack) => {
        if (ack?.received) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.time === fileData.time && msg.username === username
                ? { ...msg, status: 'delivered' }
                : msg
            )
          );
        }
      });

      setMessages((prev) => [...prev, { ...fileData, self: true, status: 'sent' }]);
    };
    reader.readAsDataURL(file);
  };

const handleLogout = () => {
  socket.disconnect();
  window.location.reload(); // or use React state to go back to login
};

  return (
    <div className="chat-container">
      {/* Online Users */}
      <div className="online-users">
        <h3>Online ({onlineUsers.length})</h3>
        <ul>
          {onlineUsers.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.self ? 'self' : 'other'}>
            <strong>{msg.username}:</strong>{' '}
            {msg.text ? (
              msg.text
            ) : (
              <a href={msg.fileContent} download={msg.fileName}>
                📎 {msg.fileName}
              </a>
            )}{' '}
            <small>
              {msg.time} {msg.self && (msg.status === 'delivered' ? '✅' : '⏳')}
            </small>
          </div>
        ))}
        {isTyping && <div className="typing-indicator">Someone is typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input & File Upload */}
      <form onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
        />
        <input type="file" onChange={handleFileUpload} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
