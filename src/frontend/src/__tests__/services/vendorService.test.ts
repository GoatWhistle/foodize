import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../../services/api';
import { vendorService } from '@shared/services/vendorService.js';
import type { StaffRequestStatus, Schemas } from '@shared/types/models';

type VendorCreate = Schemas['VendorCreate'];

describe('vendorService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    mock.restore();
  });

  it('createProfile sends POST to /vendors/', async () => {
    const mockData = { name: 'My Resto', description: 'Good food' };
    mock.onPost('/vendors/').reply(200, { id: 'v1', ...mockData });

    const result = await vendorService.createProfile(mockData as unknown as VendorCreate);
    expect((result.data as unknown as { name: string }).name).toBe('My Resto');
  });

  it('getMyProfile sends GET to /vendors/', async () => {
    const mockData = { id: 'v1', name: 'My Resto' };
    mock.onGet('/vendors/').reply(200, mockData);

    const result = await vendorService.getMyProfile();
    expect(result.data).toEqual(mockData);
  });

  it('getFinance sends GET to /vendors/finance', async () => {
    const mockData = { average_check: 500 };
    mock.onGet('/vendors/finance').reply(200, mockData);

    const result = await vendorService.getFinance();
    expect(result.data).toEqual(mockData);
  });

  it('getStaffRequests sends GET to /staff/my-requests', async () => {
    const mockData = [{ id: 'req-1', status: 'pending' }];
    mock.onGet('/staff/my-requests').reply(200, mockData);

    const result = await vendorService.getStaffRequests();
    expect(result.data).toEqual(mockData);
  });

  it('updateStaffStatus sends PATCH to /staff/requests/:id/status', async () => {
    const requestId = 'req-1';
    const status = 'approved' as unknown as StaffRequestStatus;
    mock
      .onPatch(`/staff/requests/${requestId}/status`)
      .reply(200, { id: requestId, status });

    const result = await vendorService.updateStaffStatus(requestId, status);
    expect((result.data as unknown as { status: StaffRequestStatus }).status).toBe(status);
  });

  it('getStaffMembers sends GET to /staff/my-members', async () => {
    const mockData = [{ id: 'staff-1', status: 'APPROVED' }];
    mock.onGet('/staff/my-members').reply(200, mockData);

    const result = await vendorService.getStaffMembers();
    expect(result.data).toEqual(mockData);
  });

  it('removeStaffMember sends DELETE to /staff/members/:id', async () => {
    mock.onDelete('/staff/members/staff-1').reply(204);

    const result = await vendorService.removeStaffMember('staff-1');
    expect(result.status).toBe(204);
  });

  it('getMyProfile rejects on 404 response', async () => {
    mock.onGet('/vendors/').reply(404, { detail: 'not found' });
    await expect(vendorService.getMyProfile()).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it('createProfile rejects on 422 response', async () => {
    mock.onPost('/vendors/').reply(422, { detail: 'invalid' });
    await expect(
      vendorService.createProfile({})
    ).rejects.toMatchObject({ response: { status: 422 } });
  });
});
