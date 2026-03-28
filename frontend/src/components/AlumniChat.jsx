import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/AlumniChat.css';

const AlumniChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get auth info on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    if (!storedToken) {
      navigate('/login');
      return;
    }
    setToken(storedToken);
    setUserId(storedUserId);
  }, [navigate]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      await fetch(`http://localhost:5000/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [token]);

  // Fetch conversations
  useEffect(() => {
    if (!token) return;

    const fetchConversations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/messages', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          // Group messages by conversation partner
          const convMap = {};
          data.forEach((msg) => {
            const partnerId =
              msg.senderId === userId ? msg.recipientId : msg.senderId;
            const partnerName =
              msg.senderId === userId ? msg.recipientName : msg.senderName;
            if (!convMap[partnerId]) {
              convMap[partnerId] = {
                partnerId,
                partnerName,
                lastMessage: msg.content,
                lastTime: msg.createdAt,
                unreadCount: 0,
              };
            }
            // Update unread count
            if (msg.recipientId === userId && !msg.isRead) {
              convMap[partnerId].unreadCount += 1;
            }
          });
          const convList = Object.values(convMap).sort(
            (a, b) => new Date(b.lastTime) - new Date(a.lastTime)
          );
          setConversations(convList);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, [token, userId]);

  // Pre-select chat if coming from alumni directory or notification
  useEffect(() => {
    if (location.state?.recipientId && conversations.length > 0) {
      const conversation = conversations.find((conv) => conv.partnerId === location.state.recipientId);
      if (conversation) {
        setSelectedChat(conversation);
      } else {
        setSelectedChat({
          partnerId: location.state.recipientId,
          partnerName: location.state.recipientName,
          lastMessage: '',
          lastTime: new Date().toISOString(),
          unreadCount: 0,
        });
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, conversations]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!token || !selectedChat) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/messages?otherId=${selectedChat.partnerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
          // Mark messages as read
          data.forEach((msg) => {
            if (msg.recipientId === userId && !msg.isRead) {
              markMessageAsRead(msg._id);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [token, selectedChat, userId, markMessageAsRead]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedChat.partnerId,
          content: messageInput,
        }),
      });

      if (response.ok) {
        setMessageInput('');
        const refreshResponse = await fetch(
          `http://localhost:5000/api/messages?otherId=${selectedChat.partnerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setMessages(data);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setLoading(false);
  };

  const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessages(messages.filter((msg) => msg._id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getAvatar = (name) => {
    return name ? name.charAt(0).toUpperCase() : '👤';
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="alumni-chat-container">
      <div className="chat-header">
        <div>
          <h1>💬 Alumni Messaging</h1>
          <p>Connect privately with fellow alumni</p>
        </div>
      </div>

      <div className="chat-main">
        {/* Sidebar - Conversations List */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search alumni..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <div className="empty-message">
                <p>👥</p>
                <strong>{searchTerm ? 'No matches found' : 'No conversations'}</strong>
                <small>
                  {!searchTerm && 'Start chatting from Alumni Directory →'}
                </small>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.partnerId}
                  className={`conversation-item ${
                    selectedChat?.partnerId === conv.partnerId ? 'active' : ''
                  }`}
                  onClick={() => setSelectedChat(conv)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="conv-avatar">{getAvatar(conv.partnerName)}</div>
                  <div className="conv-info">
                    <div className="conv-name">{conv.partnerName}</div>
                    <div className="conv-preview">
                      {conv.lastMessage.substring(0, 40)}
                    </div>
                  </div>
                  <div className="conv-meta">
                    <div className="conv-time">{formatTime(conv.lastTime)}</div>
                    {conv.unreadCount > 0 && (
                      <div className="unread-badge">{conv.unreadCount}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          {!selectedChat ? (
            <div className="no-chat-selected">
              <div className="empty-state">
                <div className="empty-icon">💭</div>
                <h2>Select a conversation to start</h2>
                <p>Click any alumni from the left sidebar to view messages</p>
                <button
                  className="btn-directory"
                  onClick={() => navigate('/alumni-directory')}
                >
                  📋 Go to Alumni Directory
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-window-header">
                <div className="header-content">
                  <div className="header-avatar">{getAvatar(selectedChat.partnerName)}</div>
                  <div>
                    <h3>{selectedChat.partnerName}</h3>
                    <small>Click to view profile</small>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="messages-area">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <div className="wave">👋</div>
                    <p>No messages yet</p>
                    <small>Send the first message to start the conversation</small>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`message-bubble ${
                        msg.senderId === userId ? 'own' : 'other'
                      }`}
                    >
                      <div className="message-content">{msg.content}</div>
                      <div className="message-meta">
                        {msg.senderId === userId && (
                          <button
                            className="delete-btn"
                            onClick={() => deleteMessage(msg._id)}
                            title="Delete message"
                          >
                            Delete
                          </button>
                        )}
                        <span className="message-time">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form className="message-input-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="send-btn"
                  disabled={loading || !messageInput.trim()}
                  title="Send message"
                >
                  {loading ? '⏳' : '📤'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniChat;

