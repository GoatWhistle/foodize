import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../../services/api';
import { reviewService } from '@shared/services/reviewService.js';

describe('reviewService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    mock.restore();
  });

  it('getReviews sends GET to /restaurants/{id}/reviews', async () => {
    const mockData = { data: [{ id: '1' }], total: 1 };
    mock.onGet('/restaurants/123/reviews').reply(200, mockData);

    const result = await reviewService.getReviews('123', { page: 1, size: 10 });
    expect(result.data).toEqual(mockData);
  });

  it('getRating sends GET to /restaurants/{id}/rating', async () => {
    const mockData = { average_rating: 4.5, count: 10 };
    mock.onGet('/restaurants/123/rating').reply(200, mockData);

    const result = await reviewService.getRating('123');
    expect(result.data).toEqual(mockData);
  });

  it('createReview sends POST to /restaurants/{id}/reviews', async () => {
    const payload = { rating: 5, comment: 'Great!' };
    mock.onPost('/restaurants/123/reviews').reply(201, { id: '2' });

    const result = await reviewService.createReview('123', payload);
    expect(result.status).toEqual(201);
  });

  it('deleteReview sends DELETE to /restaurants/{id}/reviews/{reviewId}', async () => {
    mock.onDelete('/restaurants/123/reviews/rev-1').reply(200, { id: 'rev-1' });

    const result = await reviewService.deleteReview('123', 'rev-1');
    expect(result.status).toEqual(200);
  });

  it('getReviews rejects on 500 response', async () => {
    mock.onGet('/restaurants/123/reviews').reply(500, { detail: 'boom' });
    await expect(
      reviewService.getReviews('123', { page: 1, size: 10 })
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it('createReview rejects on 422 response', async () => {
    mock.onPost('/restaurants/123/reviews').reply(422, { detail: 'invalid' });
    await expect(
      reviewService.createReview('123', { rating: 0, text: '' })
    ).rejects.toMatchObject({ response: { status: 422 } });
  });
});
