import React, { useState, useEffect } from 'react';
import { getUserActivitySummary } from '../../services/userAPI';
import toast from 'react-hot-toast';

const UserActivitySummary = () => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setIsLoading(true);
        const response = await getUserActivitySummary();
        if (response.data.success) {
          setSummary(response.data.data);
        }
      } catch (error) {
        console.error('Error loading user activity summary:', error);
        toast.error('Failed to load user activity summary');
      } finally {
        setIsLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
        <h2 className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        User Activity Summary
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">
            {summary.totalUsers}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
            New Users (Last 7 Days)
          </h3>
          <p className="text-3xl font-bold text-green-800 dark:text-green-200">
            {summary.newUsers}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
            Active Users (Last 7 Days)
          </h3>
          <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">
            {summary.activeUsers}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserActivitySummary; 