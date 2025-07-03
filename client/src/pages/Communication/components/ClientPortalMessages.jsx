import React, { useState } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const ClientPortalMessages = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      clientName: 'John Smith',
      projectName: 'Kitchen Renovation',
      message: 'Hi! I have a question about the timeline for the cabinet installation.',
      timestamp: '2 hours ago',
      isRead: false,
      isClient: true
    },
    {
      id: 2,
      clientName: 'Sarah Wilson',
      projectName: 'Bathroom Remodel',
      message: 'The progress photos look great! When will the next phase begin?',
      timestamp: '1 day ago',
      isRead: true,
      isClient: true
    }
  ]);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleReply = (messageId) => {
    if (replyText.trim()) {
      // In a real app, this would send the reply to the backend
      console.log('Sending reply:', replyText);
      setReplyText('');
    }
  };

  const markAsRead = (messageId) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Client Portal Messages</h3>
        </div>
        <span className="text-sm text-gray-500">
          {messages.filter(m => !m.isRead).length} unread
        </span>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`border rounded-lg p-4 transition-colors ${
              !message.isRead 
                ? 'border-blue-200 bg-blue-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {message.clientName}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {message.projectName}
                  </span>
                  {!message.isRead && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      New
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-2">{message.message}</p>
                <span className="text-sm text-gray-500">{message.timestamp}</span>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {!message.isRead && (
                  <button
                    onClick={() => markAsRead(message.id)}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Mark as read"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {selectedMessage === message.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReply(message.id)}
                      disabled={!replyText.trim()}
                      className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No client messages yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPortalMessages; 