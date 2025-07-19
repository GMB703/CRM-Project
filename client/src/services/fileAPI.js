import { api } from './api';

export const getFiles = async () => {
  return api.get('/files');
};

export const uploadFile = async (formData) => {
  return api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteFile = async (id) => {
  return api.delete(`/files/${id}`);
}; 