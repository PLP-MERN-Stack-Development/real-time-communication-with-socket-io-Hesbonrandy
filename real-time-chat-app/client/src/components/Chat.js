import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ username, socket }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to the bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Listen for incoming messages
  useEffect(() => {
    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Listen for incoming files
    socket.on('receive_file', (data) => {
      setMessages((prev) => [...prev, data]);
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

  // Listen for online users updates
  useEffect(() => {
    socket.on('user_status', ({ users }) => {
      setOnlineUsers(users);
    });
    return () => socket.off('user_status');
  }, [socket]);

  // Handle sending a message
  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const messageData = {
        username,
        text: input,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      socket.emit('send_message', messageData);
      setMessages((prev) => [...prev, { ...messageData, self: true }]);
      setInput('');
    }
  };

  // Handle typing events
  const handleTyping = () => {
    socket.emit('typing', { username });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing');
    }, 1000);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = {
        username,
        fileName: file.name,
        fileType: file.type,
        fileContent: reader.result, // base64 string
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      socket.emit('send_file', fileData);
      setMessages((prev) => [...prev, { ...fileData, self: true }]);
    };
    reader.readAsDataURL(file);
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

      {/* Chat Messages */}
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
            <small>{msg.time}</small>
          </div>
        ))}
        {isTyping && <div className="typing-indicator">Someone is typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input & File Upload */}
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
