import { describe, it, expect, vi, type Mock } from 'vitest';
import { notificationService } from '@shared/services/notificationService.js';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { api } from '../../services/api';
describe('notificationService', () => {
  it('getNotifications calls GET /notifications', async () => {
    await notificationService.getNotifications({ page: 1 });
    expect(vi.mocked(api).get).toHaveBeenCalledWith('/notifications', { params: { page: 1 } });
  });

  it('markAsRead calls POST /notifications/:id/read', async () => {
    await notificationService.markAsRead('notif-1');
    expect(vi.mocked(api).post).toHaveBeenCalledWith('/notifications/notif-1/read');
  });

  it('markAllAsRead calls POST /notifications/read-all', async () => {
    await notificationService.markAllAsRead();
    expect(vi.mocked(api).post).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('deleteNotification calls DELETE /notifications/:id', async () => {
    await notificationService.deleteNotification('notif-1');
    expect(vi.mocked(api).delete).toHaveBeenCalledWith('/notifications/notif-1');
  });

  it('deleteAll calls DELETE /notifications', async () => {
    await notificationService.deleteAll();
    expect(vi.mocked(api).delete).toHaveBeenCalledWith('/notifications');
  });

  it('getNotifications rejects when api responds with an error', async () => {
    (vi.mocked(api).get as Mock).mockRejectedValueOnce({ response: { status: 500 } });
    await expect(
      notificationService.getNotifications({ page: 1 })
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it('markAsRead rejects when api responds with a 404', async () => {
    (vi.mocked(api).post as Mock).mockRejectedValueOnce({ response: { status: 404 } });
    await expect(notificationService.markAsRead('missing')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
