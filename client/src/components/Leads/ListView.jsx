import React from "react";
import {
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const ListView = ({
  leads,
  onEdit,
  onDelete,
  sortField,
  sortDirection,
  onSort,
  loading,
}) => {
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  const renderSortableHeader = (field, label) => (
    <th
      className="px-4 py-2 text-left cursor-pointer hover:bg-gray-50"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {getSortIcon(field)}
      </div>
    </th>
  );

  const getStatusColor = (status) => {
    const statusColors = {
      NEW: "bg-blue-100 text-blue-800",
      CONTACTED: "bg-yellow-100 text-yellow-800",
      QUALIFIED: "bg-green-100 text-green-800",
      PROPOSAL: "bg-purple-100 text-purple-800",
      NEGOTIATION: "bg-indigo-100 text-indigo-800",
      WON: "bg-emerald-100 text-emerald-800",
      LOST: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const formatAddress = (lead) => {
    const parts = [];
    if (lead.address) parts.push(lead.address);
    if (lead.city) parts.push(lead.city);
    if (lead.state) parts.push(lead.state);
    if (lead.zipCode) parts.push(lead.zipCode);
    return parts.join(", ") || "No address provided";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {renderSortableHeader("name", "Name")}
            {renderSortableHeader("company", "Company")}
            {renderSortableHeader("email", "Email")}
            {renderSortableHeader("phone", "Phone")}
            {renderSortableHeader("address", "Address")}
            {renderSortableHeader("status", "Status")}
            {renderSortableHeader("updatedAt", "Last Updated")}
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead._id} className="hover:bg-gray-50">
              <td className="px-4 py-2">{lead.name}</td>
              <td className="px-4 py-2">{lead.company}</td>
              <td className="px-4 py-2">{lead.email}</td>
              <td className="px-4 py-2">{lead.phone}</td>
              <td className="px-4 py-2">
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span
                    className="truncate max-w-xs"
                    title={formatAddress(lead)}
                  >
                    {formatAddress(lead)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}
                >
                  {lead.status}
                </span>
              </td>
              <td className="px-4 py-2">
                {new Date(lead.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(lead)}
                    className="p-1 text-gray-600 hover:text-blue-600"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(lead._id)}
                    className="p-1 text-gray-600 hover:text-red-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { ListView };
