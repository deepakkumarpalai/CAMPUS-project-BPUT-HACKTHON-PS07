import api from './api';

export const interactionService = {
  list: () => api.get('/interactions'),
  create: (payload) => api.post('/interactions', payload),
  update: (id, payload) => api.put(`/interactions/${id}`, payload),
  remove: (id) => api.delete(`/interactions/${id}`)
};
