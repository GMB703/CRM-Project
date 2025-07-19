import React from 'react';

const LeadList = ({ leads, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b dark:border-gray-700">Name</th>
            <th className="py-2 px-4 border-b dark:border-gray-700">Email</th>
            <th className="py-2 px-4 border-b dark:border-gray-700">Phone</th>
            <th className="py-2 px-4 border-b dark:border-gray-700">Status</th>
            <th className="py-2 px-4 border-b dark:border-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="py-2 px-4 border-b dark:border-gray-700">{lead.firstName} {lead.lastName}</td>
              <td className="py-2 px-4 border-b dark:border-gray-700">{lead.email}</td>
              <td className="py-2 px-4 border-b dark:border-gray-700">{lead.phone}</td>
              <td className="py-2 px-4 border-b dark:border-gray-700">{lead.status}</td>
              <td className="py-2 px-4 border-b dark:border-gray-700">
                <button
                  onClick={() => onEdit(lead)}
                  className="mr-2 px-2 py-1 bg-blue-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(lead.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadList; 