import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { api } from '../../services/api';
import { adminService } from '../../services/adminService';
import MockAdapter from 'axios-mock-adapter';

describe('adminService restaurants, vendors, reviews and stats', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    mock.restore();
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
});
