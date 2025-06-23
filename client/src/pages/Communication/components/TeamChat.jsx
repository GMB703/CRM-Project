import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';

const TeamChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const user = useSelector((state) => state.auth.user);
  const currentProject = useSelector((state) => state.projects.currentProject);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      if (currentProject) {
        newSocket.emit('join_room', currentProject.id);
      }
    });

    newSocket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    setSocket(newSocket);

    // Fetch existing messages
    fetchMessages();

    return () => newSocket.close();
  }, [currentProject]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages/${currentProject.id}`);
      const data = await response.json();
      setMessages(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      content: newMessage,
      projectId: currentProject.id,
      userId: user.id,
      type: 'TEXT'
    };

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        socket.emit('send_message', messageData);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', currentProject.id);
    formData.append('userId', user.id);

    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        socket.emit('send_message', data);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentProject) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Please select a project to view the team chat.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-300px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.userId === user.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.userId === user.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.user?.name || 'Unknown User'}
              </div>
              {message.type === 'TEXT' ? (
                <p>{message.content}</p>
              ) : (
                <div>
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-200 underline"
                  >
                    {message.fileName}
                  </a>
                </div>
              )}
              <div className="text-xs mt-1 opacity-75">
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamChat; 