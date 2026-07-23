import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { api } from '../../services/api';
import { adminService } from '../../services/adminService';
import MockAdapter from 'axios-mock-adapter';

describe('adminService users and orders', () => {
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

  it('activateUser sends POST', async () => {
    mock.onPost('/admin/users/1/activate').reply(200, { data: null });
    await adminService.activateUser('1');
    expect(mock.history.post[0]?.url).toEqual('/admin/users/1/activate');
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
