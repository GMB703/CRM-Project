import React, { useState, useEffect } from 'react';
import { getMessageTemplates, createMessageTemplate } from '../../../services/communicationAPI';
import toast from 'react-hot-toast';

const MessageTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
  });

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await getMessageTemplates();
        if (response.data.success) {
          setTemplates(response.data.data);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Failed to load templates');
      }
    };

    loadTemplates();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.body) {
      toast.error('Please fill out all fields');
      return;
    }

    try {
      const response = await createMessageTemplate(formData);
      if (response.data.success) {
        setTemplates([...templates, response.data.data]);
        toast.success('Template created successfully');
        setIsFormOpen(false);
        setFormData({ name: '', subject: '', body: '' });
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Message Templates</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create Template
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="space-y-6 mb-6">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Template Name"
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Subject"
            className="w-full px-3 py-2 border rounded"
          />
          <textarea
            name="body"
            value={formData.body}
            onChange={handleChange}
            placeholder="Body"
            className="w-full px-3 py-2 border rounded"
            rows="6"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save Template
          </button>
        </form>
      )}

      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="p-4 border rounded">
            <h3 className="font-semibold">{template.name}</h3>
            <p className="text-gray-600">{template.subject}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageTemplates; 