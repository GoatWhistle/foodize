import { describe, it, expect, vi } from 'vitest';
import { favoriteService } from '@shared/services/favoriteService.js';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../../services/api';

describe('favoriteService', () => {
  it('getAll calls GET /favorites', async () => {
    await favoriteService.getAll({ page: 1 });
    expect(api.get).toHaveBeenCalledWith('/favorites', { params: { page: 1 } });
  });

  it('add calls POST /favorites/:id', async () => {
    await favoriteService.add('rest-1');
    expect(api.post).toHaveBeenCalledWith('/favorites/rest-1');
  });

  it('remove calls DELETE /favorites/:id', async () => {
    await favoriteService.remove('rest-1');
    expect(api.delete).toHaveBeenCalledWith('/favorites/rest-1');
  });
});
