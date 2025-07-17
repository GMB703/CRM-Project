import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ViewColumnsIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { PipelineView } from "../components/Leads/PipelineView.jsx";
import { ListView } from "../components/Leads/ListView.jsx";
import { LeadForm } from "../components/Leads/LeadForm.jsx";
import { api } from "../services/api";
import toast from "react-hot-toast";

const leadStatuses = [
  { value: "all", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

const leadSources = [
  "Website",
  "Referral",
  "Social Media",
  "Email Campaign",
  "Trade Show",
  "Cold Call",
  "Other",
];

const Leads = () => {
  const [viewMode, setViewMode] = useState("list");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("updatedAt");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get("/leads");
      if (response.data?.success) {
        setLeads(response.data.data || []);
      } else {
        setLeads(response.data || []);
      }
    } catch (error) {
      toast.error("Failed to fetch leads");
      console.error("Error fetching leads:", error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (leadData) => {
    try {
      const response = await api.post("/leads", leadData);
      setLeads((prev) => [response.data, ...prev]);
      setShowForm(false);
      setSelectedLead(null);
      toast.success("Lead created successfully");
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Failed to create lead");
    }
  };

  const handleUpdateLead = async (leadData) => {
    try {
      const response = await api.put(`/leads/${selectedLead.id}`, leadData);
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === selectedLead.id ? response.data : lead,
        ),
      );
      setShowForm(false);
      setSelectedLead(null);
      toast.success("Lead updated successfully");
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;

    try {
      await api.delete(`/leads/${leadId}`);
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      toast.success("Lead deleted successfully");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    }
  };

  const handleEditClick = (lead) => {
    setSelectedLead(lead);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setSelectedLead(null);
    setShowForm(false);
  };

  const handleFormSubmit = (formData) => {
    if (selectedLead) {
      handleUpdateLead(formData);
    } else {
      handleCreateLead(formData);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedLeads = leads
    .filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.address &&
          lead.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.city &&
          lead.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.state &&
          lead.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.zipCode &&
          lead.zipCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md ${
                viewMode === "list"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("pipeline")}
              className={`p-2 rounded-md ${
                viewMode === "pipeline"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ViewColumnsIcon className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Lead
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {leadStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {viewMode === "list" ? (
        <ListView
          leads={filteredAndSortedLeads}
          onEdit={handleEditClick}
          onDelete={handleDeleteLead}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          loading={loading}
        />
      ) : (
        <PipelineView
          leads={leads}
          onLeadUpdate={handleUpdateLead}
          onLeadEdit={handleEditClick}
          onLeadDelete={handleDeleteLead}
        />
      )}

      {showForm && (
        <LeadForm
          lead={selectedLead}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export { Leads };
