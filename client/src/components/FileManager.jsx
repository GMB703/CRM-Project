import React, { useState, useEffect } from 'react';
import { getFiles, uploadFile, deleteFile } from '../services/fileAPI';
import toast from 'react-hot-toast';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await getFiles();
        if (response.data.success) {
          setFiles(response.data.data);
        }
      } catch (error) {
        console.error('Error loading files:', error);
        toast.error('Failed to load files');
      }
    };

    loadFiles();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await uploadFile(formData);
      if (response.data.success) {
        setFiles([...files, response.data.data]);
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFile(id);
      setFiles(files.filter((file) => file.id !== id));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">File Manager</h2>
      <div className="mb-6">
        <input type="file" onChange={handleFileChange} disabled={isUploading} />
        {isUploading && <p>Uploading...</p>}
      </div>
      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.id} className="p-4 border rounded flex justify-between items-center">
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              {file.name}
            </a>
            <button
              onClick={() => handleDelete(file.id)}
              className="px-2 py-1 bg-red-500 text-white rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileManager; 