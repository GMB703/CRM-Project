import { api } from './api';

export const getContractTemplates = async () => {
  return api.get('/contracts/templates');
};

export const createContractTemplate = async (templateData) => {
  return api.post('/contracts/templates', templateData);
}; 