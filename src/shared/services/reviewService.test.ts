import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { reviewService } from "@shared/services/reviewService";

let mock: InstanceType<typeof MockAdapter>;

describe("reviewService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("createReview posts a review", async () => {
    mock.onPost("/restaurants/r1/reviews").reply(201, { data: { id: "rev1" } });
    await reviewService.createReview("r1", { rating: 5 });
    expect(mock.history.post[0]?.url).toBe("/restaurants/r1/reviews");
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      rating: 5,
    });
  });

  it("deleteReview deletes a review", async () => {
    mock.onDelete("/restaurants/r1/reviews/rev1").reply(200, { data: null });
    const res = await reviewService.deleteReview("r1", "rev1");
    expect(mock.history.delete[0]?.url).toBe("/restaurants/r1/reviews/rev1");
    expect(res.status).toBe(200);
  });

  it("updateMyReview puts to the my-review endpoint", async () => {
    mock.onPut("/restaurants/r1/reviews/my").reply(200, { data: {} });
    await reviewService.updateMyReview("r1", { rating: 4 });
    expect(mock.history.put[0]?.url).toBe("/restaurants/r1/reviews/my");
  });

  it("getReviews forwards params", async () => {
    mock.onGet("/restaurants/r1/reviews").reply(200, { data: [] });
    await reviewService.getReviews("r1", { page: 2 });
    expect(mock.history.get[0]?.params).toEqual({ page: 2 });
  });

  it("getReviews defaults to empty params", async () => {
    mock.onGet("/restaurants/r1/reviews").reply(200, { data: [] });
    const res = await reviewService.getReviews("r1");
    expect(res.status).toBe(200);
  });

  it("getRating gets the aggregate rating", async () => {
    mock.onGet("/restaurants/r1/rating").reply(200, { data: { average: 4.5 } });
    const res = await reviewService.getRating("r1");
    expect(res.status).toBe(200);
  });

  it("rejects on a server error", async () => {
    mock.onGet("/restaurants/r1/rating").reply(500, { detail: "boom" });
    await expect(reviewService.getRating("r1")).rejects.toBeTruthy();
  });
});
