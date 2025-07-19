import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../hooks/useAuth";
import { useOrganization } from "../contexts/OrganizationContext.jsx";
import { Spinner } from "../components/UI/Spinner";
import { Modal } from "../components/UI/Modal.jsx";
import { Button } from "../components/UI/Button.jsx";
import { EstimateForm } from "../components/Estimates/EstimateForm.jsx";
import { EstimateViewer } from "../components/Estimates/EstimateViewer.jsx";
import { api } from "../services/api";

const Estimates = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch estimates
  const fetchEstimates = async () => {
    try {
      setLoading(true);
      const response = await api.get("/estimates");
      setEstimates(response.data.data || []);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      toast.error("Failed to load estimates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrganization) {
      fetchEstimates();
    }
  }, [currentOrganization]);

  // Filter estimates
  const filteredEstimates = estimates.filter((estimate) => {
    const matchesSearch =
      estimate.estimateNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      estimate.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || estimate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle create estimate
  const handleCreateEstimate = async (estimateData) => {
    try {
      const response = await api.post("/estimates", estimateData);
      setEstimates((prev) => [response.data.data, ...prev]);
      setShowCreateModal(false);
      toast.success("Estimate created successfully");
    } catch (error) {
      console.error("Error creating estimate:", error);
      toast.error("Failed to create estimate");
      throw error;
    }
  };

  // Handle update estimate
  const handleUpdateEstimate = async (estimateData) => {
    try {
      const response = await api.put(
        `/estimates/${selectedEstimate.id}`,
        estimateData,
      );
      setEstimates((prev) =>
        prev.map((est) =>
          est.id === selectedEstimate.id ? response.data.data : est,
        ),
      );
      setShowEditModal(false);
      setSelectedEstimate(null);
      toast.success("Estimate updated successfully");
    } catch (error) {
      console.error("Error updating estimate:", error);
      toast.error("Failed to update estimate");
      throw error;
    }
  };

  // Handle delete estimate
  const handleDeleteEstimate = async (estimateId) => {
    if (!window.confirm("Are you sure you want to delete this estimate?")) {
      return;
    }

    try {
      setActionLoading(estimateId);
      await api.delete(`/estimates/${estimateId}`);
      setEstimates((prev) => prev.filter((est) => est.id !== estimateId));
      toast.success("Estimate deleted successfully");
    } catch (error) {
      console.error("Error deleting estimate:", error);
      toast.error("Failed to delete estimate");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle download PDF
  const handleDownloadPDF = async (estimateId) => {
    try {
      setActionLoading(`pdf-${estimateId}`);
      const response = await api.get(`/estimates/${estimateId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estimate-${estimateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle email estimate
  const handleEmailEstimate = async (estimateId) => {
    try {
      setActionLoading(`email-${estimateId}`);
      await api.post(`/estimates/${estimateId}/email`);
      toast.success("Estimate emailed successfully");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    } finally {
      setActionLoading(null);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", icon: ClockIcon },
      sent: { color: "bg-blue-100 text-blue-800", icon: EnvelopeIcon },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircleIcon },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircleIcon },
      expired: {
        color: "bg-yellow-100 text-yellow-800",
        icon: ExclamationTriangleIcon,
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estimates</h1>
          <p className="text-gray-600">Create and manage project estimates</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Estimate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search estimates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Estimates Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEstimates.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">
                      No estimates found
                    </p>
                    <p>Get started by creating your first estimate</p>
                  </td>
                </tr>
              ) : (
                filteredEstimates.map((estimate) => (
                  <tr key={estimate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {estimate.estimateNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {estimate.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {estimate.clientName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {estimate.clientEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${estimate.totalAmount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={estimate.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(estimate.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEstimate(estimate);
                            setShowViewModal(true);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                          title="View"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEstimate(estimate);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(estimate.id)}
                          disabled={actionLoading === `pdf-${estimate.id}`}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                          title="Download PDF"
                        >
                          {actionLoading === `pdf-${estimate.id}` ? (
                            <Spinner size="sm" />
                          ) : (
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEmailEstimate(estimate.id)}
                          disabled={actionLoading === `email-${estimate.id}`}
                          className="text-purple-600 hover:text-purple-800 disabled:opacity-50"
                          title="Email"
                        >
                          {actionLoading === `email-${estimate.id}` ? (
                            <Spinner size="sm" />
                          ) : (
                            <EnvelopeIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteEstimate(estimate.id)}
                          disabled={actionLoading === estimate.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Delete"
                        >
                          {actionLoading === estimate.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Estimate Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Estimate"
        size="xl"
      >
        <EstimateForm
          onSubmit={handleCreateEstimate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Estimate Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEstimate(null);
        }}
        title="Edit Estimate"
        size="xl"
      >
        {selectedEstimate && (
          <EstimateForm
            estimate={selectedEstimate}
            onSubmit={handleUpdateEstimate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedEstimate(null);
            }}
          />
        )}
      </Modal>

      {/* View Estimate Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedEstimate(null);
        }}
        title="View Estimate"
        size="xl"
      >
        {selectedEstimate && (
          <EstimateViewer
            estimate={selectedEstimate}
            onClose={() => {
              setShowViewModal(false);
              setSelectedEstimate(null);
            }}
            onEdit={() => {
              setShowViewModal(false);
              setShowEditModal(true);
            }}
            onDownloadPDF={() => handleDownloadPDF(selectedEstimate.id)}
            onEmail={() => handleEmailEstimate(selectedEstimate.id)}
            actionLoading={actionLoading}
          />
        )}
      </Modal>
    </div>
  );
};

export { Estimates };
