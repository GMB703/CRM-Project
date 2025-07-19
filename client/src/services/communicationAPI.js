import { api } from './api';

export const getMessageTemplates = async () => {
  return api.get('/communications/templates');
};

export const createMessageTemplate = async (templateData) => {
  return api.post('/communications/templates', templateData);
};

export const sendMessage = async (messageData) => {
  return api.post('/communications/send', messageData);
}; 