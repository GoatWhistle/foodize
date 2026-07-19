import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { api } from '../../services/api';
import { adminService } from '../../services/adminService';
import MockAdapter from 'axios-mock-adapter';

describe('adminService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    mock.restore();
  });

  it('getUsers unwraps list envelope to items and total', async () => {
    mock.onGet('/admin/users').reply(200, { data: [{ id: '1' }], pagination: { total: 7 } });

    const result = await adminService.getUsers({ page: 1, size: 20 });
    expect(result).toEqual({ items: [{ id: '1' }], total: 7 });
    expect(mock.history.get[0]?.url).toEqual('/admin/users');
  });

  it('getUser unwraps single envelope', async () => {
    mock.onGet('/admin/users/1').reply(200, { data: { id: '1', name: 'Test Admin' } });

    const result = await adminService.getUser('1');
    expect(result).toEqual({ id: '1', name: 'Test Admin' });
  });

  it('deleteUser sends DELETE to /admin/users/{id}', async () => {
    mock.onDelete('/admin/users/1').reply(200, { data: null });

    await adminService.deleteUser('1');
    expect(mock.history.delete[0]?.url).toEqual('/admin/users/1');
  });

  it('grantAdmin sends POST to /admin/users/{id}/grant-admin', async () => {
    mock.onPost('/admin/users/1/grant-admin').reply(200, { data: null });

    await adminService.grantAdmin('1');
    expect(mock.history.post[0]?.url).toEqual('/admin/users/1/grant-admin');
  });

  it('setPermissions sends POST with permissions body', async () => {
    mock.onPost('/admin/users/1/permissions').reply(200, { data: null });

    await adminService.setPermissions('1', ['admin.access']);
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      permissions: ['admin.access'],
    });
  });

  it('resetMyPermissions sends POST to /admin/me/reset-permissions', async () => {
    mock.onPost('/admin/me/reset-permissions').reply(200, { data: null });

    await adminService.resetMyPermissions();
    expect(mock.history.post[0]?.url).toEqual('/admin/me/reset-permissions');
  });

  it('getOrders unwraps list envelope', async () => {
    mock.onGet('/admin/orders').reply(200, { data: [], pagination: { total: 0 } });

    const result = await adminService.getOrders({ page: 1, size: 20 });
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('forceCancelOrder sends POST with reason and unwraps order', async () => {
    mock.onPost('/admin/orders/o1/cancel').reply(200, { data: { id: 'o1', status: 'CANCELLED' } });

    const result = await adminService.forceCancelOrder('o1', 'fraud');
    expect(result).toEqual({ id: 'o1', status: 'CANCELLED' });
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({ reason: 'fraud' });
  });

  it('getRestaurants unwraps list envelope', async () => {
    mock.onGet('/admin/restaurants').reply(200, { data: [], pagination: { total: 0 } });

    const result = await adminService.getRestaurants({ page: 1, size: 20 });
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('getRestaurant unwraps single envelope', async () => {
    mock.onGet('/admin/restaurants/1').reply(200, { data: { id: '1', name: 'Foodize' } });

    const result = await adminService.getRestaurant('1');
    expect(result).toEqual({ id: '1', name: 'Foodize' });
  });

  it('deleteRestaurant sends DELETE', async () => {
    mock.onDelete('/admin/restaurants/1').reply(200, { data: null });

    await adminService.deleteRestaurant('1');
    expect(mock.history.delete[0]?.url).toEqual('/admin/restaurants/1');
  });

  it('approveRestaurant unwraps single envelope', async () => {
    mock.onPost('/admin/restaurants/1/approve').reply(200, { data: { id: '1' } });

    const result = await adminService.approveRestaurant('1');
    expect(result).toEqual({ id: '1' });
  });

  it('rejectRestaurant sends reason and unwraps', async () => {
    mock.onPost('/admin/restaurants/1/reject').reply(200, { data: { id: '1' } });

    const result = await adminService.rejectRestaurant('1', 'bad docs');
    expect(result).toEqual({ id: '1' });
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({ reason: 'bad docs' });
  });

  it('getVendors unwraps list envelope', async () => {
    mock.onGet('/admin/vendors').reply(200, { data: [], pagination: { total: 0 } });

    const result = await adminService.getVendors({ page: 1, size: 20 });
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('getVendor unwraps single envelope', async () => {
    mock.onGet('/admin/vendors/1').reply(200, { data: { id: '1', name: 'Vendor' } });

    const result = await adminService.getVendor('1');
    expect(result).toEqual({ id: '1', name: 'Vendor' });
  });

  it('deleteVendor sends DELETE', async () => {
    mock.onDelete('/admin/vendors/1').reply(200, { data: null });

    await adminService.deleteVendor('1');
    expect(mock.history.delete[0]?.url).toEqual('/admin/vendors/1');
  });

  it('approveVendor unwraps single envelope', async () => {
    mock.onPost('/admin/vendors/1/approve').reply(200, { data: { id: '1' } });

    const result = await adminService.approveVendor('1');
    expect(result).toEqual({ id: '1' });
  });

  it('rejectVendor sends reason and unwraps', async () => {
    mock.onPost('/admin/vendors/1/reject').reply(200, { data: { id: '1' } });

    const result = await adminService.rejectVendor('1', 'bad docs');
    expect(result).toEqual({ id: '1' });
  });

  it('getReviews unwraps list envelope', async () => {
    mock.onGet('/admin/reviews').reply(200, { data: [], pagination: { total: 0 } });

    const result = await adminService.getReviews({ page: 1, size: 20 });
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('deleteReview sends DELETE', async () => {
    mock.onDelete('/admin/reviews/1').reply(200, { data: null });

    await adminService.deleteReview('1');
    expect(mock.history.delete[0]?.url).toEqual('/admin/reviews/1');
  });

  it('getPlatformStats unwraps single envelope', async () => {
    mock.onGet('/admin/stats').reply(200, { data: { total_users: 10 } });

    const result = await adminService.getPlatformStats();
    expect(result).toEqual({ total_users: 10 });
  });

  it('getFinance unwraps single envelope', async () => {
    mock.onGet('/admin/finance').reply(200, { data: { average_check: 500 } });

    const result = await adminService.getFinance();
    expect(result).toEqual({ average_check: 500 });
  });

  it('activateUser sends POST', async () => {
    mock.onPost('/admin/users/1/activate').reply(200, { data: null });
    await adminService.activateUser('1');
    expect(mock.history.post[0]?.url).toEqual('/admin/users/1/activate');
  });

  it('getAdvancedAnalytics unwraps single envelope', async () => {
    mock.onGet('/admin/analytics').reply(200, { data: { conversion: 1 } });
    const result = await adminService.getAdvancedAnalytics({ period: '7d' });
    expect(result).toEqual({ conversion: 1 });
  });

  it('getAuditLogs unwraps list envelope', async () => {
    mock.onGet('/admin/audit-logs').reply(200, { data: [], pagination: { total: 0 } });
    const result = await adminService.getAuditLogs({ page: 1 });
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('batchDeactivateUsers sends POST with ids', async () => {
    mock.onPost('/admin/users/batch-deactivate').reply(200, { data: null });
    await adminService.batchDeactivateUsers(['1', '2']);
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({ ids: ['1', '2'] });
  });

  it('batchActivateUsers sends POST with ids', async () => {
    mock.onPost('/admin/users/batch-activate').reply(200, { data: null });
    await adminService.batchActivateUsers(['1']);
    expect(mock.history.post[0]?.url).toEqual('/admin/users/batch-activate');
  });

  it('batchDeleteReviews sends DELETE with ids', async () => {
    mock.onDelete('/admin/reviews/batch').reply(200, { data: null });
    await adminService.batchDeleteReviews(['r1']);
    expect(mock.history.delete[0]?.url).toEqual('/admin/reviews/batch');
  });

  it('batchApproveVendors sends POST with ids', async () => {
    mock.onPost('/admin/vendors/batch-approve').reply(200, { data: null });
    await adminService.batchApproveVendors(['v1']);
    expect(mock.history.post[0]?.url).toEqual('/admin/vendors/batch-approve');
  });

  it('batchRejectVendors sends POST with ids and reason', async () => {
    mock.onPost('/admin/vendors/batch-reject').reply(200, { data: null });
    await adminService.batchRejectVendors(['v1'], 'docs');
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({ ids: ['v1'], reason: 'docs' });
  });

  it('batchApproveRestaurants sends POST with ids', async () => {
    mock.onPost('/admin/restaurants/batch-approve').reply(200, { data: null });
    await adminService.batchApproveRestaurants(['r1']);
    expect(mock.history.post[0]?.url).toEqual('/admin/restaurants/batch-approve');
  });

  it('batchRejectRestaurants sends POST with ids and reason', async () => {
    mock.onPost('/admin/restaurants/batch-reject').reply(200, { data: null });
    await adminService.batchRejectRestaurants(['r1'], 'docs');
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({ ids: ['r1'], reason: 'docs' });
  });

  it('exportUsersCSV returns a blob', async () => {
    mock.onGet('/admin/export/users.csv').reply(200, new Blob());
    const result = await adminService.exportUsersCSV();
    expect(result).toBeInstanceOf(Blob);
  });

  it('exportOrdersCSV returns a blob with params', async () => {
    mock.onGet('/admin/export/orders.csv').reply(200, new Blob());
    const result = await adminService.exportOrdersCSV({ from: '2026-01-01' });
    expect(result).toBeInstanceOf(Blob);
  });

  it('exportRestaurantsCSV returns a blob', async () => {
    mock.onGet('/admin/export/restaurants.csv').reply(200, new Blob());
    const result = await adminService.exportRestaurantsCSV();
    expect(result).toBeInstanceOf(Blob);
  });

  it('exportVendorsCSV returns a blob', async () => {
    mock.onGet('/admin/export/vendors.csv').reply(200, new Blob());
    const result = await adminService.exportVendorsCSV();
    expect(result).toBeInstanceOf(Blob);
  });

  it('exportReviewsCSV returns a blob', async () => {
    mock.onGet('/admin/export/reviews.csv').reply(200, new Blob());
    const result = await adminService.exportReviewsCSV({ rating: 5 });
    expect(result).toBeInstanceOf(Blob);
  });

  it('exportFinancePDF returns a blob', async () => {
    mock.onGet('/admin/export/finance.pdf').reply(200, new Blob());
    const result = await adminService.exportFinancePDF({ period: '7d' });
    expect(result).toBeInstanceOf(Blob);
  });

  it('exportAnalyticsPDF returns a blob', async () => {
    mock.onGet('/admin/export/analytics.pdf').reply(200, new Blob());
    const result = await adminService.exportAnalyticsPDF({});
    expect(result).toBeInstanceOf(Blob);
  });

  it('exportOverviewPDF returns a blob', async () => {
    mock.onGet('/admin/export/overview.pdf').reply(200, new Blob());
    const result = await adminService.exportOverviewPDF({});
    expect(result).toBeInstanceOf(Blob);
  });

  it('getUsers rejects on 500 response', async () => {
    mock.onGet('/admin/users').reply(500, { detail: 'boom' });
    await expect(adminService.getUsers({ page: 1, size: 20 })).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it('forceCancelOrder rejects on 403 response', async () => {
    mock.onPost('/admin/orders/o1/cancel').reply(403, { detail: 'forbidden' });
    await expect(adminService.forceCancelOrder('o1', 'fraud')).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});
