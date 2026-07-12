import { describe, it, expect, vi } from 'vitest';
import { userService } from '@shared/services/userService.js';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../../services/api';

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
});
