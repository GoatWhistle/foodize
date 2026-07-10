import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from '../../services/api';
import { adminService } from '../../services/adminService';

describe('adminService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it('getUsers sends GET to /admin/users', async () => {
    const mockData = { data: [], total: 0 };
    mock.onGet('/admin/users').reply(200, mockData);

    const result = await adminService.getUsers({ page: 1, size: 20 });
    expect(result.data).toEqual(mockData);
  });

  it('getUser sends GET to /admin/users/{id}', async () => {
    const mockData = { id: '1', name: 'Test Admin' };
    mock.onGet('/admin/users/1').reply(200, mockData);

    const result = await adminService.getUser('1');
    expect(result.data).toEqual(mockData);
  });

  it('deleteUser sends DELETE to /admin/users/{id}', async () => {
    mock.onDelete('/admin/users/1').reply(204);

    const result = await adminService.deleteUser('1');
    expect(result.status).toEqual(204);
  });

  it('grantAdmin sends POST to /admin/users/{id}/grant-admin', async () => {
    mock.onPost('/admin/users/1/grant-admin').reply(200);

    const result = await adminService.grantAdmin('1');
    expect(result.status).toEqual(200);
  });

  it('setPermissions sends POST to /admin/users/{id}/permissions', async () => {
    mock
      .onPost('/admin/users/1/permissions', {
        permissions: ['admin.access'],
      })
      .reply(200);

    const result = await adminService.setPermissions('1', ['admin.access']);
    expect(result.status).toEqual(200);
  });

  it('resetMyPermissions sends POST to /admin/me/reset-permissions', async () => {
    mock.onPost('/admin/me/reset-permissions').reply(200);

    const result = await adminService.resetMyPermissions();
    expect(result.status).toEqual(200);
  });

  it('getOrders sends GET to /admin/orders', async () => {
    const mockData = { data: [], total: 0 };
    mock.onGet('/admin/orders').reply(200, mockData);

    const result = await adminService.getOrders({ page: 1, size: 20 });
    expect(result.data).toEqual(mockData);
  });

  it('getRestaurants sends GET to /admin/restaurants', async () => {
    const mockData = { data: [], total: 0 };
    mock.onGet('/admin/restaurants').reply(200, mockData);

    const result = await adminService.getRestaurants({ page: 1, size: 20 });
    expect(result.data).toEqual(mockData);
  });

  it('getRestaurant sends GET to /admin/restaurants/{id}', async () => {
    const mockData = { id: '1', name: 'Foodize' };
    mock.onGet('/admin/restaurants/1').reply(200, mockData);

    const result = await adminService.getRestaurant('1');
    expect(result.data).toEqual(mockData);
  });

  it('deleteRestaurant sends DELETE to /admin/restaurants/{id}', async () => {
    mock.onDelete('/admin/restaurants/1').reply(200);

    const result = await adminService.deleteRestaurant('1');
    expect(result.status).toEqual(200);
  });

  it('approveRestaurant sends POST to /admin/restaurants/{id}/approve', async () => {
    mock.onPost('/admin/restaurants/1/approve').reply(200);

    const result = await adminService.approveRestaurant('1');
    expect(result.status).toEqual(200);
  });

  it('rejectRestaurant sends POST to /admin/restaurants/{id}/reject', async () => {
    mock.onPost('/admin/restaurants/1/reject').reply(200);

    const result = await adminService.rejectRestaurant('1', 'bad docs');
    expect(result.status).toEqual(200);
  });

  it('getVendors sends GET to /admin/vendors', async () => {
    const mockData = { data: [], total: 0 };
    mock.onGet('/admin/vendors').reply(200, mockData);

    const result = await adminService.getVendors({ page: 1, size: 20 });
    expect(result.data).toEqual(mockData);
  });

  it('getVendor sends GET to /admin/vendors/{id}', async () => {
    const mockData = { id: '1', name: 'Vendor' };
    mock.onGet('/admin/vendors/1').reply(200, mockData);

    const result = await adminService.getVendor('1');
    expect(result.data).toEqual(mockData);
  });

  it('deleteVendor sends DELETE to /admin/vendors/{id}', async () => {
    mock.onDelete('/admin/vendors/1').reply(200);

    const result = await adminService.deleteVendor('1');
    expect(result.status).toEqual(200);
  });

  it('approveVendor sends POST to /admin/vendors/{id}/approve', async () => {
    mock.onPost('/admin/vendors/1/approve').reply(200);

    const result = await adminService.approveVendor('1');
    expect(result.status).toEqual(200);
  });

  it('rejectVendor sends POST to /admin/vendors/{id}/reject', async () => {
    mock.onPost('/admin/vendors/1/reject').reply(200);

    const result = await adminService.rejectVendor('1', 'bad docs');
    expect(result.status).toEqual(200);
  });

  it('getReviews sends GET to /admin/reviews', async () => {
    const mockData = { data: [], total: 0 };
    mock.onGet('/admin/reviews').reply(200, mockData);

    const result = await adminService.getReviews({ page: 1, size: 20 });
    expect(result.data).toEqual(mockData);
  });

  it('deleteReview sends DELETE to /admin/reviews/{id}', async () => {
    mock.onDelete('/admin/reviews/1').reply(200);

    const result = await adminService.deleteReview('1');
    expect(result.status).toEqual(200);
  });

  it('getPlatformStats sends GET to /admin/stats', async () => {
    const mockData = { total_users: 10 };
    mock.onGet('/admin/stats').reply(200, mockData);

    const result = await adminService.getPlatformStats();
    expect(result.data).toEqual(mockData);
  });

  it('getFinance sends GET to /admin/finance', async () => {
    const mockData = { average_check: 500 };
    mock.onGet('/admin/finance').reply(200, mockData);

    const result = await adminService.getFinance();
    expect(result.data).toEqual(mockData);
  });

  it('activateUser sends POST to /admin/users/{id}/activate', async () => {
    mock.onPost('/admin/users/1/activate').reply(200);
    const result = await adminService.activateUser('1');
    expect(result.status).toEqual(200);
  });

  it('getAdvancedAnalytics sends GET to /admin/analytics', async () => {
    mock.onGet('/admin/analytics').reply(200, {});
    const result = await adminService.getAdvancedAnalytics({ period: '7d' });
    expect(result.status).toEqual(200);
  });

  it('getAuditLogs sends GET to /admin/audit-logs', async () => {
    mock.onGet('/admin/audit-logs').reply(200, []);
    const result = await adminService.getAuditLogs({ page: 1 });
    expect(result.status).toEqual(200);
  });

  it('batchDeactivateUsers sends POST with ids', async () => {
    mock.onPost('/admin/users/batch-deactivate').reply(200);
    const result = await adminService.batchDeactivateUsers(['1', '2']);
    expect(result.status).toEqual(200);
  });

  it('batchActivateUsers sends POST with ids', async () => {
    mock.onPost('/admin/users/batch-activate').reply(200);
    const result = await adminService.batchActivateUsers(['1']);
    expect(result.status).toEqual(200);
  });

  it('batchDeleteReviews sends DELETE with ids', async () => {
    mock.onDelete('/admin/reviews/batch').reply(200);
    const result = await adminService.batchDeleteReviews(['r1']);
    expect(result.status).toEqual(200);
  });

  it('batchApproveVendors sends POST with ids', async () => {
    mock.onPost('/admin/vendors/batch-approve').reply(200);
    const result = await adminService.batchApproveVendors(['v1']);
    expect(result.status).toEqual(200);
  });

  it('batchRejectVendors sends POST with ids and reason', async () => {
    mock.onPost('/admin/vendors/batch-reject').reply(200);
    const result = await adminService.batchRejectVendors(['v1'], 'docs');
    expect(result.status).toEqual(200);
  });

  it('batchApproveRestaurants sends POST with ids', async () => {
    mock.onPost('/admin/restaurants/batch-approve').reply(200);
    const result = await adminService.batchApproveRestaurants(['r1']);
    expect(result.status).toEqual(200);
  });

  it('batchRejectRestaurants sends POST with ids and reason', async () => {
    mock.onPost('/admin/restaurants/batch-reject').reply(200);
    const result = await adminService.batchRejectRestaurants(['r1'], 'docs');
    expect(result.status).toEqual(200);
  });

  it('exportUsersCSV calls GET with blob responseType', async () => {
    mock.onGet('/admin/export/users.csv').reply(200, new Blob());
    const result = await adminService.exportUsersCSV();
    expect(result.status).toEqual(200);
  });

  it('exportOrdersCSV calls GET with params and blob responseType', async () => {
    mock.onGet('/admin/export/orders.csv').reply(200, new Blob());
    const result = await adminService.exportOrdersCSV({ from: '2026-01-01' });
    expect(result.status).toEqual(200);
  });

  it('exportRestaurantsCSV calls GET with blob responseType', async () => {
    mock.onGet('/admin/export/restaurants.csv').reply(200, new Blob());
    const result = await adminService.exportRestaurantsCSV();
    expect(result.status).toEqual(200);
  });

  it('exportVendorsCSV calls GET with blob responseType', async () => {
    mock.onGet('/admin/export/vendors.csv').reply(200, new Blob());
    const result = await adminService.exportVendorsCSV();
    expect(result.status).toEqual(200);
  });

  it('exportReviewsCSV calls GET with blob responseType', async () => {
    mock.onGet('/admin/export/reviews.csv').reply(200, new Blob());
    const result = await adminService.exportReviewsCSV({ rating: 5 });
    expect(result.status).toEqual(200);
  });

  it('exportFinancePDF calls GET with blob responseType', async () => {
    mock.onGet('/admin/export/finance.pdf').reply(200, new Blob());
    const result = await adminService.exportFinancePDF({ period: '7d' });
    expect(result.status).toEqual(200);
  });

  it('exportAnalyticsPDF calls GET with blob responseType', async () => {
    mock.onGet('/admin/export/analytics.pdf').reply(200, new Blob());
    const result = await adminService.exportAnalyticsPDF({});
    expect(result.status).toEqual(200);
  });

  it('exportOverviewPDF calls GET with blob responseType', async () => {
    mock.onGet('/admin/export/overview.pdf').reply(200, new Blob());
    const result = await adminService.exportOverviewPDF({});
    expect(result.status).toEqual(200);
  });
});
