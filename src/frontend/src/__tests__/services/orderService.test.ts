import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../../services/api';
import { orderService } from '@shared/services/orderService.js';

describe('orderService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    mock.restore();
  });

  it('create sends POST to /orders/', async () => {
    const mockData = { id: '1', status: 'PENDING' };
    mock.onPost('/orders/').reply(201, mockData);

    const result = await orderService.create({ restaurant_id: '2', items: [], redeem_points: 0 });
    expect(result.data).toEqual(mockData);
  });

  it('getMyOrders sends GET to /orders/me', async () => {
    const mockData = [{ id: '1' }];
    mock.onGet('/orders/me').reply(200, mockData);

    const result = await orderService.getMyOrders();
    expect(result.data).toEqual(mockData);
  });

  it('getById sends GET to /orders/{id}', async () => {
    const mockData = { id: '123' };
    mock.onGet('/orders/123').reply(200, mockData);

    const result = await orderService.getById('123');
    expect(result.data).toEqual(mockData);
  });

  it('getOrderEvents sends GET to /orders/{id}/events', async () => {
    mock.onGet('/orders/123/events').reply(200, []);

    const result = await orderService.getOrderEvents('123');
    expect(result.data).toEqual([]);
  });

  it('cancelOrder sends POST to /orders/{id}/cancel', async () => {
    mock.onPost('/orders/123/cancel').reply(200, { id: '123', status: 'CANCELLED' });

    const result = await orderService.cancelOrder('123', 'Changed mind');
    expect(result.data).toEqual({ id: '123', status: 'CANCELLED' });
    expect(mock.history.post[0]?.data).toBe(JSON.stringify({ reason: 'Changed mind' }));
  });

  it('cancelOrder sends null reason when not provided', async () => {
    mock.onPost('/orders/456/cancel').reply(200, { id: '456' });

    await orderService.cancelOrder('456');
    expect(mock.history.post[0]?.data).toBe(JSON.stringify({ reason: null }));
  });

  it('completeOrder sends POST to /orders/{id}/complete', async () => {
    mock.onPost('/orders/789/complete').reply(200, { id: '789', status: 'COMPLETED' });

    const result = await orderService.completeOrder('789');
    expect(result.data).toEqual({ id: '789', status: 'COMPLETED' });
  });

  it('create rejects on 422 response', async () => {
    mock.onPost('/orders/').reply(422, { detail: 'invalid order' });
    await expect(
      orderService.create({ restaurant_id: '2', items: [], redeem_points: 0 })
    ).rejects.toMatchObject({ response: { status: 422 } });
  });

  it('getById rejects on 404 response', async () => {
    mock.onGet('/orders/missing').reply(404, { detail: 'not found' });
    await expect(orderService.getById('missing')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
