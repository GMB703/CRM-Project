import React, { useState } from 'react';
import SendMessage from './components/SendMessage';
import MessageTemplates from './components/MessageTemplates';

const CommunicationHub = () => {
  const [activeTab, setActiveTab] = useState('send');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Communication Hub</h1>
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('send')}
          className={`py-2 px-4 ${
            activeTab === 'send'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          Send Message
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-2 px-4 ${
            activeTab === 'templates'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          Message Templates
        </button>
      </div>

      {activeTab === 'send' && <SendMessage />}
      {activeTab === 'templates' && <MessageTemplates />}
    </div>
  );
};

export default CommunicationHub;
