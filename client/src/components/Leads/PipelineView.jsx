import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { ChevronRightIcon, UserIcon } from "@heroicons/react/24/outline";
import { getPipelineData, updateLeadStage } from "../../services/leadAPI";
import toast from "react-hot-toast";

const leadStatuses = [
  { id: "NEW", label: "New Leads", color: "bg-blue-100 border-blue-300" },
  {
    id: "CONTACTED",
    label: "Contacted",
    color: "bg-yellow-100 border-yellow-300",
  },
  {
    id: "QUALIFIED",
    label: "Qualified",
    color: "bg-green-100 border-green-300",
  },
  {
    id: "PROPOSAL",
    label: "Proposal",
    color: "bg-purple-100 border-purple-300",
  },
  {
    id: "NEGOTIATION",
    label: "Negotiation",
    color: "bg-indigo-100 border-indigo-300",
  },
  { id: "CLOSED_WON", label: "Won", color: "bg-green-100 border-green-300" },
  { id: "CLOSED_LOST", label: "Lost", color: "bg-red-100 border-red-300" },
];

const PipelineView = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPipelineData();
      setLeads(response.data || []);
    } catch (err) {
      console.error("Error loading leads:", err);
      setError("Failed to load leads");
      toast.error("Failed to load pipeline data");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Drop outside the list or no movement
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const leadId = draggableId;

    try {
      // Optimistically update the UI
      const updatedLeads = leads.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead,
      );
      setLeads(updatedLeads);

      // Update the backend
      await updateLeadStage(leadId, newStatus);
      toast.success("Lead status updated");
    } catch (error) {
      // Revert on failure
      console.error("Error updating lead status:", error);
      toast.error("Failed to update lead status");
      loadLeads(); // Reload the original state
    }
  };

  const getLeadsByStatus = (status) => {
    return leads.filter((lead) => lead.status === status);
  };

  const calculateValue = (leads) => {
    return leads.reduce((total, lead) => total + (lead.value || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading pipeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadLeads}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto">
        <div className="inline-flex gap-4 p-4 min-w-full">
          {leadStatuses.map((status) => (
            <div key={status.id} className="w-80 flex-shrink-0">
              <div
                className={`rounded-t-lg px-4 py-2 ${status.color} border-b`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{status.label}</h3>
                  <span className="text-sm">
                    {getLeadsByStatus(status.id).length} leads
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  $
                  {calculateValue(getLeadsByStatus(status.id)).toLocaleString()}
                </div>
              </div>

              <Droppable droppableId={status.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[calc(100vh-15rem)] p-2 rounded-b-lg ${
                      snapshot.isDraggingOver ? "bg-gray-50" : "bg-white"
                    } border border-t-0 ${status.color.replace("bg-", "border-")}`}
                  >
                    {getLeadsByStatus(status.id).map((lead, index) => (
                      <Draggable
                        key={lead.id}
                        draggableId={lead.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 p-3 rounded-lg bg-white shadow-sm border ${
                              snapshot.isDragging ? "shadow-md" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {lead.firstName} {lead.lastName}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {lead.company}
                                </div>
                                {lead.value && (
                                  <div className="text-sm font-medium text-green-600">
                                    ${lead.value.toLocaleString()}
                                  </div>
                                )}
                              </div>
                              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Last updated:{" "}
                              {new Date(lead.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};

export { PipelineView };
