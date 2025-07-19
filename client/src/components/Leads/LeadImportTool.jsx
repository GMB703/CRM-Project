import React, { useState } from 'react';
import Papa from 'papaparse';
import { createLead } from '../../services/leadAPI';
import toast from 'react-hot-toast';

const LeadImportTool = () => {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const leads = results.data;

        for (const lead of leads) {
          try {
            await createLead(lead);
          } catch (error) {
            console.error('Error importing lead:', error);
            toast.error(`Failed to import lead: ${lead.email}`);
          }
        }

        setIsImporting(false);
        toast.success('Lead import complete');
      },
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Lead Import Tool</h2>
      <div className="flex items-center space-x-4">
        <input type="file" onChange={handleFileChange} />
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          {isImporting ? 'Importing...' : 'Import'}
        </button>
      </div>
    </div>
  );
};

export default LeadImportTool; 