import React, { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

const EmailIntegration = () => {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/communications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        setEmailData({ to: '', subject: '', body: '' });
        // Show success message
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-gray-700">
            To
          </label>
          <input
            type="email"
            id="to"
            value={emailData.to}
            onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={emailData.subject}
            onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            id="body"
            rows={6}
            value={emailData.body}
            onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            Send Email
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailIntegration; 