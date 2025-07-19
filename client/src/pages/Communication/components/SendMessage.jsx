import React, { useState, useEffect } from 'react';
import { getUsers } from '../../../services/userAPI';
import { getMessageTemplates, sendMessage } from '../../../services/communicationAPI';
import toast from 'react-hot-toast';

const SendMessage = () => {
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templateId, setTemplateId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const usersResponse = await getUsers();
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.data);
        }
        const templatesResponse = await getMessageTemplates();
        if (templatesResponse.data.success) {
          setTemplates(templatesResponse.data.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      }
    };

    loadData();
  }, []);

  const handleTemplateChange = (e) => {
    const template = templates.find((t) => t.id === e.target.value);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
    setTemplateId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipientId || !subject || !body) {
      toast.error('Please fill out all fields');
      return;
    }

    try {
      await sendMessage({ recipientId, subject, body });
      toast.success('Message sent successfully');
      setRecipientId('');
      setSubject('');
      setBody('');
      setTemplateId('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <select
        value={recipientId}
        onChange={(e) => setRecipientId(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      >
        <option value="">Select Recipient</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.firstName} {user.lastName} ({user.email})
          </option>
        ))}
      </select>
      <select
        value={templateId}
        onChange={handleTemplateChange}
        className="w-full px-3 py-2 border rounded"
      >
        <option value="">Select Template</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className="w-full px-3 py-2 border rounded"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body"
        className="w-full px-3 py-2 border rounded"
        rows="6"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Send
      </button>
    </form>
  );
};

export default SendMessage; 