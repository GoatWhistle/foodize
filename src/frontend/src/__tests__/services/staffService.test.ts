import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../../services/api';
import { staffService } from '@shared/services/staffService.js';

describe('staffService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    mock.restore();
  });

  it('createRequest sends POST to /staff/requests/{id}', async () => {
    mock.onPost('/staff/requests/123').reply(201, { id: 'req1' });

    const result = await staffService.createRequest('123', {
      message: 'Hire me',
    });
    expect(result.status).toEqual(201);
  });

  it('createRequest rejects on 409 response', async () => {
    mock.onPost('/staff/requests/123').reply(409, { detail: 'already applied' });
    await expect(
      staffService.createRequest('123', { message: 'Hire me' })
    ).rejects.toMatchObject({ response: { status: 409 } });
  });

  it('getMyProfile rejects on 404 response', async () => {
    mock.onGet('/staff/me').reply(404, { detail: 'not found' });
    await expect(staffService.getMyProfile()).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
