import { describe, it, expect, vi, type Mock } from 'vitest';
import { cartService } from '@shared/services/cartService.js';
import type { CartUpdate } from '@shared/types/models';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { api } from '../../services/api';
describe('cartService', () => {
  it('getCart calls GET /cart', async () => {
    await cartService.getCart();
    expect(vi.mocked(api).get).toHaveBeenCalledWith('/cart');
  });

  it('updateCart calls POST /cart with data', async () => {
    const data = { items: [{ id: '1', qty: 2 }] } as unknown as CartUpdate;
    await cartService.updateCart(data);
    expect(vi.mocked(api).post).toHaveBeenCalledWith('/cart', data);
  });

  it('clearCart calls DELETE /cart', async () => {
    await cartService.clearCart();
    expect(vi.mocked(api).delete).toHaveBeenCalledWith('/cart');
  });

  it('getCart rejects when api responds with an error', async () => {
    (vi.mocked(api).get as Mock).mockRejectedValueOnce({ response: { status: 500 } });
    await expect(cartService.getCart()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it('updateCart rejects when api responds with an error', async () => {
    (vi.mocked(api).post as Mock).mockRejectedValueOnce({ response: { status: 422 } });
    await expect(
      cartService.updateCart({ items: [] } as unknown as CartUpdate)
    ).rejects.toMatchObject({ response: { status: 422 } });
  });
});
