import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { orderService } from "@shared/services/orderService";

let mock: InstanceType<typeof MockAdapter>;

describe("orderService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("create posts to /orders/ with a generated idempotency key", async () => {
    mock.onPost("/orders/").reply(201, { data: { id: "o1" } });
    await orderService.create({} as never);
    expect(mock.history.post[0]?.url).toBe("/orders/");
    expect(mock.history.post[0]?.headers?.["Idempotency-Key"]).toBeTruthy();
  });

  it("create lets an explicit idempotency key override the default", async () => {
    mock.onPost("/orders/").reply(201, { data: {} });
    await orderService.create({} as never, {
      headers: { "Idempotency-Key": "fixed" },
    });
    expect(mock.history.post[0]?.headers?.["Idempotency-Key"]).toBe("fixed");
  });

  it("getEstimate gets the estimate for a restaurant", async () => {
    mock.onGet("/orders/estimate/r1").reply(200, { data: {} });
    const res = await orderService.getEstimate("r1");
    expect(res.status).toBe(200);
  });

  it("getMyOrders forwards params", async () => {
    mock.onGet("/orders/me").reply(200, { data: [] });
    await orderService.getMyOrders({ page: 2 });
    expect(mock.history.get[0]?.params).toEqual({ page: 2 });
  });

  it("getById gets a single order", async () => {
    mock.onGet("/orders/o1").reply(200, { data: { id: "o1" } });
    const res = await orderService.getById("o1");
    expect(res.status).toBe(200);
  });

  it("getByRestaurant gets restaurant orders with params", async () => {
    mock.onGet("/orders/restaurant/r1").reply(200, { data: [] });
    await orderService.getByRestaurant("r1", { status: "PENDING" });
    expect(mock.history.get[0]?.params).toEqual({ status: "PENDING" });
  });

  it("updateStatus patches with status and extra data", async () => {
    mock.onPatch("/orders/o1/status").reply(200, { data: {} });
    await orderService.updateStatus("o1", "READY", {
      eta_minutes: 5,
    } as never);
    expect(JSON.parse(mock.history.patch[0]?.data as string)).toEqual({
      status: "READY",
      eta_minutes: 5,
    });
  });

  it("completeOrder posts to the complete endpoint", async () => {
    mock.onPost("/orders/o1/complete").reply(200, { data: {} });
    const res = await orderService.completeOrder("o1");
    expect(res.status).toBe(200);
  });

  it("cancelOrder posts a null reason by default", async () => {
    mock.onPost("/orders/o1/cancel").reply(200, { data: {} });
    await orderService.cancelOrder("o1");
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      reason: null,
    });
  });

  it("cancelOrder posts a provided reason", async () => {
    mock.onPost("/orders/o1/cancel").reply(200, { data: {} });
    await orderService.cancelOrder("o1", "too slow");
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      reason: "too slow",
    });
  });

  it("getOrderEvents gets the events list", async () => {
    mock.onGet("/orders/o1/events").reply(200, { data: [] });
    const res = await orderService.getOrderEvents("o1");
    expect(res.status).toBe(200);
  });

  it("rejects on a server error", async () => {
    mock.onGet("/orders/o1").reply(500, { detail: "boom" });
    await expect(orderService.getById("o1")).rejects.toBeTruthy();
  });
});
