import api from './api';
import type {
  AdminRestaurant,
  AdminReview,
  AdminUser,
  AdminVendor,
  AdvancedAnalytics,
  FinanceAnalytics,
  Order,
  PlatformStats,
  SuccessListResponse,
  SuccessResponse,
} from '@shared/types/models';

type QueryParams = Record<string, unknown>;

export const adminService = {
  getUsers: (params?: QueryParams) =>
    api.get<SuccessListResponse<AdminUser>>('/admin/users', { params }),
  getUser: (id: string) => api.get<SuccessResponse<AdminUser>>(`/admin/users/${id}`),
  deleteUser: (id: string) => api.delete<SuccessResponse<unknown>>(`/admin/users/${id}`),
  activateUser: (id: string) =>
    api.post<SuccessResponse<unknown>>(`/admin/users/${id}/activate`),
  grantAdmin: (id: string) =>
    api.post<SuccessResponse<unknown>>(`/admin/users/${id}/grant-admin`),
  setPermissions: (id: string, permissions: string[]) =>
    api.post<SuccessResponse<unknown>>(`/admin/users/${id}/permissions`, { permissions }),
  resetMyPermissions: () =>
    api.post<SuccessResponse<unknown>>('/admin/me/reset-permissions'),
  getOrders: (params?: QueryParams) =>
    api.get<SuccessListResponse<Order>>('/admin/orders', { params }),
  getRestaurants: (params?: QueryParams) =>
    api.get<SuccessListResponse<AdminRestaurant>>('/admin/restaurants', { params }),
  getRestaurant: (id: string) =>
    api.get<SuccessResponse<AdminRestaurant>>(`/admin/restaurants/${id}`),
  deleteRestaurant: (id: string) =>
    api.delete<SuccessResponse<unknown>>(`/admin/restaurants/${id}`),
  approveRestaurant: (id: string) =>
    api.post<SuccessResponse<AdminRestaurant>>(`/admin/restaurants/${id}/approve`),
  rejectRestaurant: (id: string, reason: string) =>
    api.post<SuccessResponse<AdminRestaurant>>(`/admin/restaurants/${id}/reject`, { reason }),
  getVendors: (params?: QueryParams) =>
    api.get<SuccessListResponse<AdminVendor>>('/admin/vendors', { params }),
  getVendor: (id: string) => api.get<SuccessResponse<AdminVendor>>(`/admin/vendors/${id}`),
  deleteVendor: (id: string) => api.delete<SuccessResponse<unknown>>(`/admin/vendors/${id}`),
  approveVendor: (id: string) =>
    api.post<SuccessResponse<AdminVendor>>(`/admin/vendors/${id}/approve`),
  rejectVendor: (id: string, reason: string) =>
    api.post<SuccessResponse<AdminVendor>>(`/admin/vendors/${id}/reject`, { reason }),
  getReviews: (params?: QueryParams) =>
    api.get<SuccessListResponse<AdminReview>>('/admin/reviews', { params }),
  deleteReview: (id: string) => api.delete<SuccessResponse<unknown>>(`/admin/reviews/${id}`),
  getPlatformStats: () => api.get<SuccessResponse<PlatformStats>>('/admin/stats'),
  getFinance: (params?: QueryParams) =>
    api.get<SuccessResponse<FinanceAnalytics>>('/admin/finance', { params }),
  getAdvancedAnalytics: (params?: QueryParams) =>
    api.get<SuccessResponse<AdvancedAnalytics>>('/admin/analytics', { params }),

  getAuditLogs: <T = unknown>(params?: QueryParams) =>
    api.get<SuccessListResponse<T>>('/admin/audit-logs', { params }),

  batchDeactivateUsers: (ids: string[]) =>
    api.post<SuccessResponse<unknown>>('/admin/users/batch-deactivate', { ids }),
  batchActivateUsers: (ids: string[]) =>
    api.post<SuccessResponse<unknown>>('/admin/users/batch-activate', { ids }),
  batchDeleteReviews: (ids: string[]) =>
    api.delete<SuccessResponse<unknown>>('/admin/reviews/batch', { data: { ids } }),

  batchApproveVendors: (ids: string[]) =>
    api.post<SuccessResponse<unknown>>('/admin/vendors/batch-approve', { ids }),
  batchRejectVendors: (ids: string[], reason: string) =>
    api.post<SuccessResponse<unknown>>('/admin/vendors/batch-reject', { ids, reason }),
  batchApproveRestaurants: (ids: string[]) =>
    api.post<SuccessResponse<unknown>>('/admin/restaurants/batch-approve', { ids }),
  batchRejectRestaurants: (ids: string[], reason: string) =>
    api.post<SuccessResponse<unknown>>('/admin/restaurants/batch-reject', { ids, reason }),

  exportUsersCSV: () =>
    api.get<Blob>('/admin/export/users.csv', { responseType: 'blob' }),
  exportOrdersCSV: (params?: QueryParams) =>
    api.get<Blob>('/admin/export/orders.csv', { params, responseType: 'blob' }),
  exportRestaurantsCSV: () =>
    api.get<Blob>('/admin/export/restaurants.csv', { responseType: 'blob' }),
  exportVendorsCSV: () =>
    api.get<Blob>('/admin/export/vendors.csv', { responseType: 'blob' }),
  exportReviewsCSV: (params?: QueryParams) =>
    api.get<Blob>('/admin/export/reviews.csv', { params, responseType: 'blob' }),
  exportFinancePDF: (params?: QueryParams) =>
    api.get<Blob>('/admin/export/finance.pdf', { params, responseType: 'blob' }),
  exportAnalyticsPDF: (params?: QueryParams) =>
    api.get<Blob>('/admin/export/analytics.pdf', { params, responseType: 'blob' }),
  exportOverviewPDF: (params?: QueryParams) =>
    api.get<Blob>('/admin/export/overview.pdf', { params, responseType: 'blob' }),
};
