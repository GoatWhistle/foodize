import { api } from './api';
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

export interface AdminListResult<T> {
  items: T[];
  total: number;
}

const unwrap = async <T>(request: Promise<{ data: SuccessResponse<T> }>): Promise<T> =>
  (await request).data.data;

const unwrapList = async <T>(
  request: Promise<{ data: SuccessListResponse<T> }>,
): Promise<AdminListResult<T>> => {
  const body = (await request).data;
  return { items: body.data, total: body.pagination.total || 0 };
};

const unwrapBlob = async (request: Promise<{ data: Blob }>): Promise<Blob> =>
  (await request).data;

export const adminService = {
  getUsers: (params?: QueryParams): Promise<AdminListResult<AdminUser>> =>
    unwrapList(api.get<SuccessListResponse<AdminUser>>('/admin/users', { params })),
  getUser: (id: string): Promise<AdminUser> =>
    unwrap(api.get<SuccessResponse<AdminUser>>(`/admin/users/${id}`)),
  deleteUser: (id: string): Promise<unknown> =>
    unwrap(api.delete<SuccessResponse<unknown>>(`/admin/users/${id}`)),
  activateUser: (id: string): Promise<unknown> =>
    unwrap(api.post<SuccessResponse<unknown>>(`/admin/users/${id}/activate`)),
  grantAdmin: (id: string): Promise<unknown> =>
    unwrap(api.post<SuccessResponse<unknown>>(`/admin/users/${id}/grant-admin`)),
  setPermissions: (id: string, permissions: string[]): Promise<unknown> =>
    unwrap(api.post<SuccessResponse<unknown>>(`/admin/users/${id}/permissions`, { permissions })),
  resetMyPermissions: (): Promise<unknown> =>
    unwrap(api.post<SuccessResponse<unknown>>('/admin/me/reset-permissions')),
  getOrders: (params?: QueryParams): Promise<AdminListResult<Order>> =>
    unwrapList(api.get<SuccessListResponse<Order>>('/admin/orders', { params })),
  forceCancelOrder: (orderId: string, reason: string): Promise<Order> =>
    unwrap(api.post<SuccessResponse<Order>>(`/admin/orders/${orderId}/cancel`, { reason })),
  getRestaurants: (params?: QueryParams): Promise<AdminListResult<AdminRestaurant>> =>
    unwrapList(api.get<SuccessListResponse<AdminRestaurant>>('/admin/restaurants', { params })),
  getRestaurant: (id: string): Promise<AdminRestaurant> =>
    unwrap(api.get<SuccessResponse<AdminRestaurant>>(`/admin/restaurants/${id}`)),
  deleteRestaurant: (id: string): Promise<unknown> =>
    unwrap(api.delete<SuccessResponse<unknown>>(`/admin/restaurants/${id}`)),
  approveRestaurant: (id: string): Promise<AdminRestaurant> =>
    unwrap(api.post<SuccessResponse<AdminRestaurant>>(`/admin/restaurants/${id}/approve`)),
  rejectRestaurant: (id: string, reason: string): Promise<AdminRestaurant> =>
    unwrap(api.post<SuccessResponse<AdminRestaurant>>(`/admin/restaurants/${id}/reject`, { reason })),
  getVendors: (params?: QueryParams): Promise<AdminListResult<AdminVendor>> =>
    unwrapList(api.get<SuccessListResponse<AdminVendor>>('/admin/vendors', { params })),
  getVendor: (id: string): Promise<AdminVendor> =>
    unwrap(api.get<SuccessResponse<AdminVendor>>(`/admin/vendors/${id}`)),
  deleteVendor: (id: string): Promise<unknown> =>
    unwrap(api.delete<SuccessResponse<unknown>>(`/admin/vendors/${id}`)),
  approveVendor: (id: string): Promise<AdminVendor> =>
    unwrap(api.post<SuccessResponse<AdminVendor>>(`/admin/vendors/${id}/approve`)),
  rejectVendor: (id: string, reason: string): Promise<AdminVendor> =>
    unwrap(api.post<SuccessResponse<AdminVendor>>(`/admin/vendors/${id}/reject`, { reason })),
  getReviews: (params?: QueryParams): Promise<AdminListResult<AdminReview>> =>
    unwrapList(api.get<SuccessListResponse<AdminReview>>('/admin/reviews', { params })),
  deleteReview: (id: string): Promise<unknown> =>
    unwrap(api.delete<SuccessResponse<unknown>>(`/admin/reviews/${id}`)),
  getPlatformStats: (): Promise<PlatformStats> =>
    unwrap(api.get<SuccessResponse<PlatformStats>>('/admin/stats')),
  getFinance: (params?: QueryParams): Promise<FinanceAnalytics> =>
    unwrap(api.get<SuccessResponse<FinanceAnalytics>>('/admin/finance', { params })),
  getAdvancedAnalytics: (params?: QueryParams): Promise<AdvancedAnalytics> =>
    unwrap(api.get<SuccessResponse<AdvancedAnalytics>>('/admin/analytics', { params })),

  getAuditLogs: <T = unknown>(params?: QueryParams): Promise<AdminListResult<T>> =>
    unwrapList(api.get<SuccessListResponse<T>>('/admin/audit-logs', { params })),

  batchDeactivateUsers: (ids: string[]): Promise<unknown> =>
    unwrap(api.post<SuccessResponse<unknown>>('/admin/users/batch-deactivate', { ids })),
  batchActivateUsers: (ids: string[]): Promise<unknown> =>
    unwrap(api.post<SuccessResponse<unknown>>('/admin/users/batch-activate', { ids })),
  batchDeleteReviews: (ids: string[]): Promise<unknown> =>
    unwrap(api.delete<SuccessResponse<unknown>>('/admin/reviews/batch', { data: { ids } })),

  batchApproveVendors: (ids: string[]): Promise<unknown> =>
    unwrap(api.post<SuccessResponse<unknown>>('/admin/vendors/batch-approve', { ids })),
  batchRejectVendors: (ids: string[], reason: string): Promise<unknown> =>
    unwrap(api.post<SuccessResponse<unknown>>('/admin/vendors/batch-reject', { ids, reason })),
  batchApproveRestaurants: (ids: string[]): Promise<unknown> =>
    unwrap(api.post<SuccessResponse<unknown>>('/admin/restaurants/batch-approve', { ids })),
  batchRejectRestaurants: (ids: string[], reason: string): Promise<unknown> =>
    unwrap(api.post<SuccessResponse<unknown>>('/admin/restaurants/batch-reject', { ids, reason })),

  exportUsersCSV: (): Promise<Blob> =>
    unwrapBlob(api.get<Blob>('/admin/export/users.csv', { responseType: 'blob' })),
  exportOrdersCSV: (params?: QueryParams): Promise<Blob> =>
    unwrapBlob(api.get<Blob>('/admin/export/orders.csv', { params, responseType: 'blob' })),
  exportRestaurantsCSV: (): Promise<Blob> =>
    unwrapBlob(api.get<Blob>('/admin/export/restaurants.csv', { responseType: 'blob' })),
  exportVendorsCSV: (): Promise<Blob> =>
    unwrapBlob(api.get<Blob>('/admin/export/vendors.csv', { responseType: 'blob' })),
  exportReviewsCSV: (params?: QueryParams): Promise<Blob> =>
    unwrapBlob(api.get<Blob>('/admin/export/reviews.csv', { params, responseType: 'blob' })),
  exportFinancePDF: (params?: QueryParams): Promise<Blob> =>
    unwrapBlob(api.get<Blob>('/admin/export/finance.pdf', { params, responseType: 'blob' })),
  exportAnalyticsPDF: (params?: QueryParams): Promise<Blob> =>
    unwrapBlob(api.get<Blob>('/admin/export/analytics.pdf', { params, responseType: 'blob' })),
  exportOverviewPDF: (params?: QueryParams): Promise<Blob> =>
    unwrapBlob(api.get<Blob>('/admin/export/overview.pdf', { params, responseType: 'blob' })),
};
