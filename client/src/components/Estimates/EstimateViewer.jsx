import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEstimateById } from '../../services/estimatesAPI';
import { Spinner } from '../UI/Spinner';
import { selectCurrentUser } from '../../store/slices/authSlice';

export const EstimateViewer = () => {
  const { id } = useParams();
  const currentUser = useSelector(selectCurrentUser);

  const {
    data: estimate,
    isLoading,
    isError,
    error,
  } = useQuery(['estimate', id], () => getEstimateById(id), {
    enabled: !!id,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <div>Error: {error.message}</div>;
  if (!estimate) return <div>Estimate not found.</div>;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Estimate Details
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Client
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {estimate.client.name}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Estimate Number
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {estimate.estimateNumber}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Date
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {new Date(estimate.date).toLocaleDateString()}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Total
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            ${parseFloat(estimate.total).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};
