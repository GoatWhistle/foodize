import { describe, it, expect, vi, type Mock } from 'vitest';
import { favoriteService } from '@shared/services/favoriteService.js';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { api } from '../../services/api';
describe('favoriteService', () => {
  it('getAll calls GET /favorites', async () => {
    await favoriteService.getAll({ page: 1 });
    expect(vi.mocked(api).get).toHaveBeenCalledWith('/favorites', { params: { page: 1 } });
  });

  it('add calls POST /favorites/:id', async () => {
    await favoriteService.add('rest-1');
    expect(vi.mocked(api).post).toHaveBeenCalledWith('/favorites/rest-1');
  });

  it('remove calls DELETE /favorites/:id', async () => {
    await favoriteService.remove('rest-1');
    expect(vi.mocked(api).delete).toHaveBeenCalledWith('/favorites/rest-1');
  });

  it('getAll rejects when api responds with an error', async () => {
    (vi.mocked(api).get as Mock).mockRejectedValueOnce({ response: { status: 500 } });
    await expect(favoriteService.getAll({ page: 1 })).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it('add rejects when api responds with a 404', async () => {
    (vi.mocked(api).post as Mock).mockRejectedValueOnce({ response: { status: 404 } });
    await expect(favoriteService.add('missing')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
