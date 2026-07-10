import api from './api';

type QueryParams = Record<string, unknown>;

export const adminService = {
  getUsers: (params?: QueryParams) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),
  grantAdmin: (id: string) => api.post(`/admin/users/${id}/grant-admin`),
  setPermissions: (id: string, permissions: string[]) =>
    api.post(`/admin/users/${id}/permissions`, { permissions }),
  resetMyPermissions: () => api.post('/admin/me/reset-permissions'),
  getOrders: (params?: QueryParams) => api.get('/admin/orders', { params }),
  getRestaurants: (params?: QueryParams) => api.get('/admin/restaurants', { params }),
  getRestaurant: (id: string) => api.get(`/admin/restaurants/${id}`),
  deleteRestaurant: (id: string) => api.delete(`/admin/restaurants/${id}`),
  approveRestaurant: (id: string) => api.post(`/admin/restaurants/${id}/approve`),
  rejectRestaurant: (id: string, reason: string) =>
    api.post(`/admin/restaurants/${id}/reject`, { reason }),
  getVendors: (params?: QueryParams) => api.get('/admin/vendors', { params }),
  getVendor: (id: string) => api.get(`/admin/vendors/${id}`),
  deleteVendor: (id: string) => api.delete(`/admin/vendors/${id}`),
  approveVendor: (id: string) => api.post(`/admin/vendors/${id}/approve`),
  rejectVendor: (id: string, reason: string) =>
    api.post(`/admin/vendors/${id}/reject`, { reason }),
  getReviews: (params?: QueryParams) => api.get('/admin/reviews', { params }),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),
  getPlatformStats: () => api.get('/admin/stats'),
  getFinance: (params?: QueryParams) => api.get('/admin/finance', { params }),
  getAdvancedAnalytics: (params?: QueryParams) => api.get('/admin/analytics', { params }),

  getAuditLogs: (params?: QueryParams) => api.get('/admin/audit-logs', { params }),

  batchDeactivateUsers: (ids: string[]) =>
    api.post('/admin/users/batch-deactivate', { ids }),
  batchActivateUsers: (ids: string[]) => api.post('/admin/users/batch-activate', { ids }),
  batchDeleteReviews: (ids: string[]) =>
    api.delete('/admin/reviews/batch', { data: { ids } }),

  batchApproveVendors: (ids: string[]) =>
    api.post('/admin/vendors/batch-approve', { ids }),
  batchRejectVendors: (ids: string[], reason: string) =>
    api.post('/admin/vendors/batch-reject', { ids, reason }),
  batchApproveRestaurants: (ids: string[]) =>
    api.post('/admin/restaurants/batch-approve', { ids }),
  batchRejectRestaurants: (ids: string[], reason: string) =>
    api.post('/admin/restaurants/batch-reject', { ids, reason }),

  exportUsersCSV: () =>
    api.get('/admin/export/users.csv', { responseType: 'blob' }),
  exportOrdersCSV: (params?: QueryParams) =>
    api.get('/admin/export/orders.csv', { params, responseType: 'blob' }),
  exportRestaurantsCSV: () =>
    api.get('/admin/export/restaurants.csv', { responseType: 'blob' }),
  exportVendorsCSV: () =>
    api.get('/admin/export/vendors.csv', { responseType: 'blob' }),
  exportReviewsCSV: (params?: QueryParams) =>
    api.get('/admin/export/reviews.csv', { params, responseType: 'blob' }),
  exportFinancePDF: (params?: QueryParams) =>
    api.get('/admin/export/finance.pdf', { params, responseType: 'blob' }),
  exportAnalyticsPDF: (params?: QueryParams) =>
    api.get('/admin/export/analytics.pdf', { params, responseType: 'blob' }),
  exportOverviewPDF: (params?: QueryParams) =>
    api.get('/admin/export/overview.pdf', { params, responseType: 'blob' }),
};
