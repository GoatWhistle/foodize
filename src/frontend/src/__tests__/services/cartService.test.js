import { describe, it, expect, vi } from 'vitest';
import { cartService } from '../../services/cartService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../../services/api';

describe('cartService', () => {
  it('getCart calls GET /cart', async () => {
    await cartService.getCart();
    expect(api.get).toHaveBeenCalledWith('/cart');
  });

  it('updateCart calls POST /cart with data', async () => {
    const data = { items: [{ id: '1', qty: 2 }] };
    await cartService.updateCart(data);
    expect(api.post).toHaveBeenCalledWith('/cart', data);
  });

  it('clearCart calls DELETE /cart', async () => {
    await cartService.clearCart();
    expect(api.delete).toHaveBeenCalledWith('/cart');
  });
});
