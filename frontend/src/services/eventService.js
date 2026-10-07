import api from './api';

export const eventService = {
  list: () => api.get('/events'),
  create: (payload) => api.post('/events', payload),
  update: (id, payload) => api.put(`/events/${id}`, payload),
  remove: (id) => api.delete(`/events/${id}`)
};
