import { describe, it, expect, vi, type Mock } from 'vitest';
import { userService } from '@shared/services/userService.js';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { api } from '../../services/api';
describe('userService', () => {
  it('getById calls GET /users/:id', async () => {
    await userService.getById('user-1');
    expect(vi.mocked(api).get).toHaveBeenCalledWith('/users/user-1');
  });

  it('updateMe calls PATCH /users/me', async () => {
    const data = { name: 'Ivan' };
    await userService.updateMe(data);
    expect(vi.mocked(api).patch).toHaveBeenCalledWith('/users/me', data);
  });

  it('changePassword calls POST /users/me/change-password', async () => {
    const data = { old_password: 'old', new_password: 'new' };
    await userService.changePassword(data);
    expect(vi.mocked(api).post).toHaveBeenCalledWith('/users/me/change-password', data);
  });

  it('getById rejects when api responds with a 404', async () => {
    (vi.mocked(api).get as Mock).mockRejectedValueOnce({ response: { status: 404 } });
    await expect(userService.getById('missing')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it('changePassword rejects when api responds with a 400', async () => {
    (vi.mocked(api).post as Mock).mockRejectedValueOnce({ response: { status: 400 } });
    await expect(
      userService.changePassword({ old_password: 'x', new_password: 'y' })
    ).rejects.toMatchObject({ response: { status: 400 } });
  });
});
