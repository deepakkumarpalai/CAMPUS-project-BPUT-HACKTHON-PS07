import api from './api';

export const publicCampusService = {
  notices: () => api.get('/public/notices'),
  events: () => api.get('/public/events'),
  faculty: () => api.get('/public/faculty')
};
