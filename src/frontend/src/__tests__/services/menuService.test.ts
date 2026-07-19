import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../../services/api';
import { menuService } from '@shared/services/menuService.js';
import type { MenuItem, MenuItemCreate } from '@shared/types/models';

describe('menuService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    mock.restore();
  });

  it('getMenu sends GET to /menu/:id', async () => {
    const restaurantId = 'rest-123';
    const mockData = [{ id: 'item-1', name: 'Pizza' }];
    mock.onGet(`/menu/${restaurantId}`).reply(200, mockData);

    const result = await menuService.getMenu(restaurantId);
    expect(result.data).toEqual(mockData);
  });

  it('addItem sends POST to /menu/:id/items', async () => {
    const restaurantId = 'rest-123';
    const mockItem = { name: 'Burger', price: 500 };
    mock
      .onPost(`/menu/${restaurantId}/items`)
      .reply(200, { id: 'item-2', ...mockItem });

    const result = await menuService.addItem(restaurantId, mockItem as MenuItemCreate);
    expect((result.data as unknown as MenuItem).name).toBe('Burger');
  });

  it('getMenu rejects on 404 response', async () => {
    mock.onGet('/menu/missing').reply(404, { detail: 'not found' });
    await expect(menuService.getMenu('missing')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it('addItem rejects on 422 response', async () => {
    mock.onPost('/menu/rest-1/items').reply(422, { detail: 'invalid' });
    await expect(
      menuService.addItem('rest-1', {} as MenuItemCreate)
    ).rejects.toMatchObject({ response: { status: 422 } });
  });
});
