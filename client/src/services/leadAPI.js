import { api } from './api';

export const getLeads = async () => {
  return api.get('/leads');
};

export const createLead = async (leadData) => {
  return api.post('/leads', leadData);
};

export const updateLead = async (id, leadData) => {
  return api.put(`/leads/${id}`, leadData);
};

export const deleteLead = async (id) => {
  return api.delete(`/leads/${id}`);
};
