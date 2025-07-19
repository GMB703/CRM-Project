import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import {
  getAllOrganizationsAdmin,
  extractOrganizationsArray,
} from '../../services/organizationAPI';
import { getUsersByOrganization } from '../../services/userAPI';
import toast from 'react-hot-toast';

const ContextSwitcher = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const currentOrganization = useSelector((state) => state.auth.organization);
  
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Load organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setIsLoading(true);
        const response = await getAllOrganizationsAdmin();
        const orgs = extractOrganizationsArray(response);
        setOrganizations(orgs);
      } catch (error) {
        console.error('Error loading organizations:', error);
        toast.error('Failed to load organizations');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  // Load users when organization changes
  useEffect(() => {
    const loadUsers = async () => {
      if (!selectedOrgId) {
        setUsers([]);
        return;
      }

      try {
        setIsLoadingUsers(true);
        const response = await getUsersByOrganization(selectedOrgId);
        if (response.data.success) {
          setUsers(response.data.data || []);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, [selectedOrgId]);

  const handleOrganizationChange = (orgId) => {
    setSelectedOrgId(orgId);
    setSelectedUserId(''); // Reset user selection when org changes
  };

  const handleUserChange = (userId) => {
    setSelectedUserId(userId);
  };

  const handleSwitchContext = async () => {
    if (!selectedOrgId || !selectedUserId) {
      toast.error('Please select both organization and user');
      return;
    }

    try {
      const selectedOrg = organizations.find(org => org.id === selectedOrgId);
      const selectedUser = users.find(user => user.id === selectedUserId);

      if (!selectedOrg || !selectedUser) {
        toast.error('Selected organization or user not found');
        return;
      }

      // Update Redux state to switch context
      dispatch(updateUser(selectedUser));

      toast.success(`Switched to ${selectedUser.firstName} ${selectedUser.lastName} at ${selectedOrg.name}`);
      
      // Reset selections
      setSelectedOrgId('');
      setSelectedUserId('');
    } catch (error) {
      console.error('Error switching context:', error);
      toast.error('Failed to switch context');
    }
  };

  const handleResetToSuperAdmin = () => {
    // Reset to original super admin context
    if (currentUser && currentUser.role === 'SUPER_ADMIN') {
      dispatch(updateUser(currentUser));
      setSelectedOrgId('');
      setSelectedUserId('');
      toast.success('Reset to Super Admin context');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Context Switcher
      </h2>
      
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Current Context
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p><strong>User:</strong> {currentUser?.firstName} {currentUser?.lastName} ({currentUser?.email})</p>
          <p><strong>Role:</strong> {currentUser?.role}</p>
          <p><strong>Organization:</strong> {currentOrganization?.name || 'None (Super Admin)'}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Organization Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Organization
          </label>
          <select
            value={selectedOrgId}
            onChange={(e) => handleOrganizationChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            <option value="">Choose an organization...</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          {isLoading && (
            <p className="text-sm text-gray-500 mt-1">Loading organizations...</p>
          )}
        </div>

        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select User
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => handleUserChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={!selectedOrgId || isLoadingUsers}
          >
            <option value="">Choose a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email}) - {user.role}
              </option>
            ))}
          </select>
          {isLoadingUsers && (
            <p className="text-sm text-gray-500 mt-1">Loading users...</p>
          )}
          {selectedOrgId && users.length === 0 && !isLoadingUsers && (
            <p className="text-sm text-gray-500 mt-1">No users found in this organization</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleSwitchContext}
            disabled={!selectedOrgId || !selectedUserId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Switch Context
          </button>
          
          <button
            onClick={handleResetToSuperAdmin}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Reset to Super Admin
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          How to Use
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Select an organization from the dropdown</li>
          <li>• Choose a user from that organization</li>
          <li>• Click "Switch Context" to view the CRM as that user</li>
          <li>• Use "Reset to Super Admin" to return to your original context</li>
          <li>• This feature is only available to Super Admins</li>
        </ul>
      </div>
    </div>
  );
};

export default ContextSwitcher; 