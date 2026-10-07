import api from './api';

export const paymentService = {
  fees: () => api.get('/payments/fees'),
  setFee: (payload) => api.post('/payments/fees', payload),
  createOrder: (feeAccountId) => api.post('/payments/orders', { feeAccountId }),
  verify: (payload) => api.post('/payments/verify', payload),
  cancelOrder: (orderId) => api.post(`/payments/orders/${orderId}/cancel`),
  history: () => api.get('/payments')
};
