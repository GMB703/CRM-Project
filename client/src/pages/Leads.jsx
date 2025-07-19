import React, { useState, useEffect } from 'react';
import { getLeads, createLead, updateLead, deleteLead } from '../services/leadAPI';
import toast from 'react-hot-toast';
import LeadList from '../components/Leads/LeadList';
import LeadForm from '../components/Leads/LeadForm';
import LeadDashboard from '../components/Leads/LeadDashboard';
import PipelineView from '../components/Leads/PipelineView';
import LeadImportTool from '../components/Leads/LeadImportTool';

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        setIsLoading(true);
        const response = await getLeads();
        if (response.data.success) {
          setLeads(response.data.data);
        }
      } catch (error) {
        console.error('Error loading leads:', error);
        toast.error('Failed to load leads');
      } finally {
        setIsLoading(false);
      }
    };

    loadLeads();
  }, []);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const lead = leads.find((lead) => lead.id === draggableId);
    const newStatus = destination.droppableId;

    try {
      const response = await updateLead(draggableId, { status: newStatus });
      if (response.data.success) {
        setLeads(
          leads.map((l) =>
            l.id === draggableId ? { ...l, status: newStatus } : l,
          ),
        );
        toast.success('Lead status updated');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleCreate = async (leadData) => {
    try {
      const response = await createLead(leadData);
      if (response.data.success) {
        setLeads([...leads, response.data.data]);
        toast.success('Lead created successfully');
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
    }
  };

  const handleUpdate = async (leadData) => {
    try {
      const response = await updateLead(selectedLead.id, leadData);
      if (response.data.success) {
        setLeads(
          leads.map((lead) =>
            lead.id === selectedLead.id ? response.data.data : lead,
          ),
        );
        toast.success('Lead updated successfully');
        setIsFormOpen(false);
        setSelectedLead(null);
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLead(id);
      setLeads(leads.filter((lead) => lead.id !== id));
      toast.success('Lead deleted successfully');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedLead(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Leads
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'pipeline' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Lead
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Import Leads
          </button>
        </div>
      </div>

      <LeadDashboard leads={leads} />

      {isLoading ? (
        <p>Loading...</p>
      ) : viewMode === 'list' ? (
        <LeadList leads={leads} onEdit={handleEdit} onDelete={handleDelete} />
      ) : (
        <PipelineView leads={leads} onDragEnd={handleDragEnd} />
      )}

      {isFormOpen && (
        <LeadForm
          lead={selectedLead}
          onClose={handleFormClose}
          onSubmit={selectedLead ? handleUpdate : handleCreate}
        />
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <LeadImportTool />
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-300 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { LeadsPage };
