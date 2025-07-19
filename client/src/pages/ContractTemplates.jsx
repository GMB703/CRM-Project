import React, { useState, useEffect } from 'react';
import { getContractTemplates, createContractTemplate } from '../services/contractAPI';
import toast from 'react-hot-toast';

const ContractTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
  });

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await getContractTemplates();
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
    if (!formData.name || !formData.content) {
      toast.error('Please fill out all fields');
      return;
    }

    try {
      const response = await createContractTemplate(formData);
      if (response.data.success) {
        setTemplates([...templates, response.data.data]);
        toast.success('Template created successfully');
        setIsFormOpen(false);
        setFormData({ name: '', content: '' });
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contract Templates</h1>
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
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Content"
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
            <h2 className="font-semibold">{template.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractTemplates; 