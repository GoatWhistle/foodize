import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { api } from '../../services/api';
import { adminService } from '../../services/adminService';
import MockAdapter from 'axios-mock-adapter';

describe('adminService batch actions and exports', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    mock.restore();
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
});
