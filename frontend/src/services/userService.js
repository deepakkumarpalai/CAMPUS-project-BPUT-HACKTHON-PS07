import api from './api';

export const userService = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  setStudentDob: (id, dateOfBirth) => api.put(`/users/${id}/student-dob`, { dateOfBirth }),
  remove: (id) => api.delete(`/users/${id}`),
  dashboard: () => api.get('/users/stats/dashboard')
};
