import { api } from './api';

export const createPaymentIntent = async (data) => {
  return api.post('/payments/create-payment-intent', data);
};

export const getPayments = async () => {
  return api.get('/payments');
}; 