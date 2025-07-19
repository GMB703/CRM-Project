import { api } from './api';

export const clientLogin = async (credentials) => {
  return api.post('/client-portal/login', credentials);
};

export const getEstimates = async () => {
  return api.get('/client-portal/estimates', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('clientToken')}`,
    },
  });
};

export const getContracts = async () => {
  return api.get('/client-portal/contracts', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('clientToken')}`,
    },
  });
}; 