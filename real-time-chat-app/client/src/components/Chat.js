// client/src/components/Chat.js
import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ username, socket, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeChat, setActiveChat] = useState('global'); // 'global' or username
  const [privateMessages, setPrivateMessages] = useState({}); // { username: [msgs] }
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, privateMessages, activeChat]);

  // Listen for messages
  useEffect(() => {
    const handleMessage = (msg, isPrivate = false) => {
      const target = isPrivate ? msg.from : 'global';
      const isSelf = msg.from === username;

      if (isPrivate) {
        setPrivateMessages((prev) => ({
          ...prev,
          [msg.from]: [...(prev[msg.from] || []), { ...msg, self: isSelf }],
        }));
      } else {
        setMessages((prev) => [...prev, { ...msg, self: isSelf }]);
      }

      // Notifications
      if (!isSelf) {
        new Audio('/message.mp3').play().catch(() => {});
        if (Notification.permission === 'granted') {
          new Notification('New message!', {
            body: `${msg.from}: ${msg.text || '📎 File'}`,
            tag: isPrivate ? `private-${msg.from}` : 'global',
          });
        }
      }
    };

    socket.on('receive_message', (msg) => handleMessage(msg, false));
    socket.on('receive_file', (msg) => handleMessage(msg, false));
    socket.on('private_message', (msg) => handleMessage(msg, true));

    return () => {
      socket.off('receive_message');
      socket.off('receive_file');
      socket.off('private_message');
    };
  }, [socket, username]);

  // Typing indicators
  useEffect(() => {
    const handleTyping = () => {
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1500);
    };

    const handleStopTyping = () => setIsTyping(false);

    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket]);

  // Online users
  useEffect(() => {
    socket.on('user_status', ({ users }) => {
      setOnlineUsers(users);
    });
    return () => socket.off('user_status');
  }, [socket]);

  // Reconnection
  useEffect(() => {
    socket.on('reconnect', () => {
      socket.emit('user_join', { username });
    });
    return () => socket.off('reconnect');
  }, [socket, username]);

  // Send message with delivery acknowledgment
  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const payload = {
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    if (activeChat === 'global') {
      socket.emit('send_message', { ...payload, username }, (ack) => {
        if (ack?.received) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.time === payload.time && msg.username === username
                ? { ...msg, status: 'delivered' }
                : msg
            )
          );
        }
      });

      setMessages((prev) => [
        ...prev,
        { ...payload, username, self: true, status: 'sent' },
      ]);
    } else {
      socket.emit('private_message', { to: activeChat, text: input }, (ack) => {
        if (ack?.received) {
          setPrivateMessages((prev) => ({
            ...prev,
            [activeChat]: prev[activeChat].map((msg) =>
              msg.time === payload.time && msg.username === username
                ? { ...msg, status: 'delivered' }
                : msg
            ),
          }));
        }
      });

      setPrivateMessages((prev) => ({
        ...prev,
        [activeChat]: [
          ...(prev[activeChat] || []),
          {
            ...payload,
            username,
            self: true,
            to: activeChat,
            status: 'sent',
          },
        ],
      }));
    }

    setInput('');
  };

  // Typing detection
  const handleTyping = () => {
    socket.emit('typing', { username });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing');
    }, 1000);
  };

  // File upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = {
        username,
        fileName: file.name,
        fileType: file.type,
        fileContent: reader.result,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

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

      setMessages((prev) => [
        ...prev,
        { ...fileData, self: true, status: 'sent' },
      ]);
    };
    reader.readAsDataURL(file);
  };

  // Get current chat messages
  const currentMessages =
    activeChat === 'global'
      ? messages
      : privateMessages[activeChat] || [];

  const filteredMessages = searchTerm
    ? currentMessages.filter(
        (msg) =>
          msg.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : currentMessages;

  // Logout handler
  const handleLogout = () => {
    socket.disconnect();
    onLogout();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
        }}
      >
        <h2 style={{ margin: 0, color: '#495057' }}>
          Welcome, <strong>{username}</strong>!
        </h2>
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {/* Online Users */}
      <div
        style={{
          padding: '10px',
          fontSize: '0.9em',
          backgroundColor: '#e9ecef',
        }}
      >
        <strong>Online ({onlineUsers.length}):</strong>{' '}
        {onlineUsers.join(', ') || '—'}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: '10px',
          overflowY: 'auto',
          backgroundColor: '#f1f3f5',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {filteredMessages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.self ? 'flex-end' : 'flex-start',
              backgroundColor: msg.self ? '#d1e7dd' : '#fff',
              padding: '8px 12px',
              margin: '4px 0',
              borderRadius: '10px',
              maxWidth: '70%',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {!msg.self && (
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '0.85em',
                  color: '#495057',
                }}
              >
                {msg.username}
              </div>
            )}
            {msg.text ? (
              <div>{msg.text}</div>
            ) : (
              <a
                href={msg.fileContent}
                download={msg.fileName}
                style={{ color: '#0d6efd', textDecoration: 'none' }}
              >
                📎 {msg.fileName}
              </a>
            )}
            <div
              style={{
                fontSize: '0.7em',
                color: '#6c757d',
                marginTop: '4px',
              }}
            >
              {msg.time} {msg.self && (msg.status === 'delivered' ? '✅' : '⏳')}
            </div>
          </div>
        ))}
        {isTyping && (
          <div
            style={{
              alignSelf: 'flex-start',
              fontStyle: 'italic',
              color: '#6c757d',
              marginTop: '4px',
            }}
          >
            Someone is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        style={{
          display: 'flex',
          padding: '10px',
          borderTop: '1px solid #dee2e6',
          backgroundColor: 'white',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            marginRight: '8px',
          }}
        />
        <input
          type="file"
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.txt"
          style={{ marginRight: '8px' }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0d6efd',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
