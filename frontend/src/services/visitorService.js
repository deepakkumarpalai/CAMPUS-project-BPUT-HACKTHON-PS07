import api from './api';

export const visitorService = {
  create: (payload) => api.post('/visitors', payload),
  status: (referenceCode) => api.get(`/visitors/status/${referenceCode}`),
  list: (params) => api.get('/visitors', { params }),
  decide: (id, status) => api.patch(`/visitors/${id}/decision`, { status }),
  verify: (qrToken) => api.post('/visitors/verify', { qrToken })
};