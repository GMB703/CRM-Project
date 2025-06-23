import React, { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

const SMSIntegration = () => {
  const [smsData, setSmsData] = useState({
    to: '',
    message: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/communications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smsData),
      });

      if (response.ok) {
        setSmsData({ to: '', message: '' });
        // Show success message
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="to"
            value={smsData.to}
            onChange={(e) => setSmsData({ ...smsData, to: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="+1234567890"
            required
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            value={smsData.message}
            onChange={(e) => setSmsData({ ...smsData, message: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            maxLength={160}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            {160 - smsData.message.length} characters remaining
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            Send SMS
          </button>
        </div>
      </form>
    </div>
  );
};

export default SMSIntegration; 