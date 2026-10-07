export const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

export const dashboardPath = (role) => {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'FACULTY') return '/faculty/dashboard';
  return '/student/dashboard';
};

export const emptyMessage = (entity) => `No ${entity} found.`;
