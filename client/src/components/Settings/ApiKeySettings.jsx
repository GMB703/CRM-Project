import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  getApiKeys, 
  createApiKey, 
  updateApiKey, 
  deleteApiKey, 
  regenerateApiKey 
} from '../../services/apiKeyAPI';
import toast from 'react-hot-toast';

const ApiKeySettings = () => {
  const user = useSelector(state => state.auth.user);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: [],
    expiresAt: ''
  });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);

  // Available permissions
  const availablePermissions = [
    { value: 'leads:read', label: 'Read Leads' },
    { value: 'leads:write', label: 'Create/Update Leads' },
    { value: 'leads:delete', label: 'Delete Leads' },
    { value: 'clients:read', label: 'Read Clients' },
    { value: 'clients:write', label: 'Create/Update Clients' },
    { value: 'clients:delete', label: 'Delete Clients' },
    { value: 'analytics:read', label: 'Read Analytics' },
    { value: 'dashboard:read', label: 'Read Dashboard' },
    { value: 'users:read', label: 'Read Users' },
    { value: 'users:write', label: 'Manage Users' },
    { value: 'settings:read', label: 'Read Settings' },
    { value: 'settings:write', label: 'Update Settings' }
  ];

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const response = await getApiKeys();
      setApiKeys(response.data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const response = await createApiKey(newKeyData);
      setNewlyCreatedKey(response.data);
      setApiKeys(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      setNewKeyData({ name: '', permissions: [], expiresAt: '' });
      toast.success('API key created successfully');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    }
  };

  const handleUpdateKey = async (id, updates) => {
    try {
      const response = await updateApiKey(id, updates);
      setApiKeys(prev => prev.map(key => 
        key.id === id ? response.data : key
      ));
      toast.success('API key updated successfully');
    } catch (error) {
      console.error('Error updating API key:', error);
      toast.error('Failed to update API key');
    }
  };

  const handleDeleteKey = async (id) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteApiKey(id);
      setApiKeys(prev => prev.filter(key => key.id !== id));
      toast.success('API key deleted successfully');
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const handleRegenerateKey = async (id) => {
    try {
      const response = await regenerateApiKey(id);
      setNewlyCreatedKey(response.data);
      setApiKeys(prev => prev.map(key => 
        key.id === id ? response.data : key
      ));
      setShowRegenerateModal(false);
      setSelectedKey(null);
      toast.success('API key regenerated successfully');
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast.error('Failed to regenerate API key');
    }
  };

  const togglePermission = (permission) => {
    setNewKeyData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never expires';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (key) => {
    if (!key.isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Inactive</span>;
    }
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
          <p className="text-gray-600 mt-1">
            Manage API keys for programmatic access to your CRM data
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create API Key
        </button>
      </div>

      {/* API Keys List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading API keys...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys yet</h3>
          <p className="text-gray-600 mb-4">Create your first API key to get started with programmatic access.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create API Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div key={key.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                    {getStatusBadge(key)}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                      {key.key}
                    </code>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="ml-2 text-gray-600">{formatDate(key.createdAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Used:</span>
                      <span className="ml-2 text-gray-600">{formatDate(key.lastUsedAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Expires:</span>
                      <span className="ml-2 text-gray-600">{formatDate(key.expiresAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Permissions:</span>
                      <span className="ml-2 text-gray-600">{key.permissions.length}</span>
                    </div>
                  </div>
                  {key.permissions.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-700">Permissions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {key.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedKey(key);
                      setShowRegenerateModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create API Key</h3>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Production API Key"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissions
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {availablePermissions.map((permission) => (
                    <label key={permission.value} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={newKeyData.permissions.includes(permission.value)}
                        onChange={() => togglePermission(permission.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newKeyData.expiresAt}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regenerate API Key Modal */}
      {showRegenerateModal && selectedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Regenerate API Key</h3>
            <p className="text-gray-600 mb-4">
              This will create a new API key and invalidate the old one. Make sure to update any applications using the current key.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRegenerateModal(false);
                  setSelectedKey(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRegenerateKey(selectedKey.id)}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Newly Created/Regenerated Key Modal */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">API Key Created</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-yellow-800 text-sm mb-2">
                <strong>Important:</strong> This is the only time you'll see the full API key. Make sure to copy it now and store it securely.
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-md mb-4">
              <code className="text-sm break-all font-mono">{newlyCreatedKey.key}</code>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(newlyCreatedKey.key)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeySettings; 