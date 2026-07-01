import { describe, it, expect, vi } from 'vitest';
import { notificationService } from '../../services/notificationService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../../services/api';

describe('notificationService', () => {
  it('getNotifications calls GET /notifications', async () => {
    await notificationService.getNotifications({ page: 1 });
    expect(api.get).toHaveBeenCalledWith('/notifications', { params: { page: 1 } });
  });

  it('markAsRead calls POST /notifications/:id/read', async () => {
    await notificationService.markAsRead('notif-1');
    expect(api.post).toHaveBeenCalledWith('/notifications/notif-1/read');
  });

  it('markAllAsRead calls POST /notifications/read-all', async () => {
    await notificationService.markAllAsRead();
    expect(api.post).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('deleteNotification calls DELETE /notifications/:id', async () => {
    await notificationService.deleteNotification('notif-1');
    expect(api.delete).toHaveBeenCalledWith('/notifications/notif-1');
  });

  it('deleteAll calls DELETE /notifications', async () => {
    await notificationService.deleteAll();
    expect(api.delete).toHaveBeenCalledWith('/notifications');
  });
});
