import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { EnvelopeIcon, PaperClipIcon } from '@heroicons/react/24/outline';

const EmailIntegration = () => {
  const [emails, setEmails] = useState([
    {
      id: 1,
      from: 'client@example.com',
      to: 'admin@acmeconst.com',
      subject: 'Project Update Request',
      body: 'Hi, could you please provide an update on our kitchen renovation project?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: 2,
      from: 'admin@acmeconst.com',
      to: 'client@example.com',
      subject: 'Re: Project Update Request',
      body: 'Thank you for your inquiry. Your project is progressing well and is on schedule.',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      read: true
    }
  ]);
  const [newEmail, setNewEmail] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [showCompose, setShowCompose] = useState(false);

  const user = useSelector((state) => state.auth?.user);
  const currentOrganization = useSelector((state) => state.organization?.currentOrganization);

  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!newEmail.to || !newEmail.subject || !newEmail.body) return;

    const emailData = {
      id: Date.now(),
      from: user?.email || 'demo@example.com',
      to: newEmail.to,
      subject: newEmail.subject,
      body: newEmail.body,
      timestamp: new Date().toISOString(),
      read: true
    };

    setEmails(prev => [emailData, ...prev]);
    setNewEmail({ to: '', subject: '', body: '' });
    setShowCompose(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Integration</h3>
          <p className="text-sm text-gray-600">
            Manage email communications with clients and team members
          </p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <EnvelopeIcon className="h-5 w-5 inline mr-2" />
          Compose
        </button>
      </div>

      {/* Compose Email */}
      {showCompose && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Compose New Email</h4>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">To</label>
              <input
                type="email"
                value={newEmail.to}
                onChange={(e) => setNewEmail(prev => ({ ...prev, to: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="recipient@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={newEmail.subject}
                onChange={(e) => setNewEmail(prev => ({ ...prev, subject: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Email subject"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={newEmail.body}
                onChange={(e) => setNewEmail(prev => ({ ...prev, body: e.target.value }))}
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Your message..."
                required
              />
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send Email
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Email List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h4 className="text-md font-medium text-gray-900">Recent Emails</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {emails.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No emails yet. Send your first email to get started.
            </div>
          ) : (
            emails.map((email) => (
              <div key={email.id} className={`p-4 hover:bg-gray-50 ${!email.read ? 'bg-blue-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {email.from}
                      </span>
                      <span className="text-sm text-gray-500">→</span>
                      <span className="text-sm text-gray-600">
                        {email.to}
                      </span>
                      {!email.read && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {email.subject}
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {email.body}
                    </div>
                  </div>
                  <div className="ml-4 text-xs text-gray-500">
                    {new Date(email.timestamp).toLocaleDateString()} {new Date(email.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <EnvelopeIcon className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Email Integration Status
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Email system is operational. Organization: {currentOrganization?.name || 'Demo Organization'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailIntegration; 