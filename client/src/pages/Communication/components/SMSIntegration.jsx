import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DevicePhoneMobileIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const SMSIntegration = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      to: '+1-555-0123',
      message: 'Hi! Your project estimate is ready for review. Please check your email.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'delivered'
    },
    {
      id: 2,
      to: '+1-555-0456',
      message: 'Reminder: Your appointment is scheduled for tomorrow at 2 PM.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'delivered'
    }
  ]);
  const [newMessage, setNewMessage] = useState({
    to: '',
    message: ''
  });
  const [showCompose, setShowCompose] = useState(false);

  const user = useSelector((state) => state.auth?.user);
  const currentOrganization = useSelector((state) => state.organization?.currentOrganization);

  const handleSendSMS = (e) => {
    e.preventDefault();
    if (!newMessage.to || !newMessage.message) return;

    const smsData = {
      id: Date.now(),
      to: newMessage.to,
      message: newMessage.message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    setMessages(prev => [smsData, ...prev]);
    setNewMessage({ to: '', message: '' });
    setShowCompose(false);

    // Simulate delivery confirmation after 2 seconds
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === smsData.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 2000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'sent':
        return 'Sending...';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">SMS Integration</h3>
          <p className="text-sm text-gray-600">
            Send SMS notifications and updates to clients
          </p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          <DevicePhoneMobileIcon className="h-5 w-5 inline mr-2" />
          Send SMS
        </button>
      </div>

      {/* Compose SMS */}
      {showCompose && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Send New SMS</h4>
          <form onSubmit={handleSendSMS} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={newMessage.to}
                onChange={(e) => setNewMessage(prev => ({ ...prev, to: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="+1-555-0123"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={newMessage.message}
                onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                maxLength={160}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="Your SMS message (max 160 characters)..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {newMessage.message.length}/160 characters
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Send SMS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SMS History */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h4 className="text-md font-medium text-gray-900">Recent SMS Messages</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {messages.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No SMS messages yet. Send your first message to get started.
            </div>
          ) : (
            messages.map((sms) => (
              <div key={sms.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        To: {sms.to}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(sms.status)}
                        <span className="text-xs text-gray-500">
                          {getStatusText(sms.status)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {sms.message}
                    </div>
                  </div>
                  <div className="ml-4 text-xs text-gray-500">
                    {new Date(sms.timestamp).toLocaleDateString()} {new Date(sms.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DevicePhoneMobileIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {messages.length}
              </div>
              <div className="text-sm text-gray-500">Total Messages</div>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {messages.filter(m => m.status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-500">Delivered</div>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">
                  {messages.length > 0 ? Math.round((messages.filter(m => m.status === 'delivered').length / messages.length) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {messages.length > 0 ? Math.round((messages.filter(m => m.status === 'delivered').length / messages.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <DevicePhoneMobileIcon className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              SMS Integration Status
            </h3>
            <p className="text-sm text-green-700 mt-1">
              SMS system is operational. Organization: {currentOrganization?.name || 'Demo Organization'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSIntegration; 