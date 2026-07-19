import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { staffService } from "@shared/services/staffService";

let mock: InstanceType<typeof MockAdapter>;

describe("staffService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("createRequest posts to /staff/requests/:restaurantId", async () => {
    mock.onPost("/staff/requests/r1").reply(201, { data: {} });
    const res = await staffService.createRequest("r1", {});
    expect(res.status).toBe(201);
    expect(mock.history.post[0]?.url).toBe("/staff/requests/r1");
  });

  it("getMyProfile gets /staff/me", async () => {
    mock.onGet("/staff/me").reply(200, { data: {} });
    const res = await staffService.getMyProfile();
    expect(res.status).toBe(200);
  });

  it("getMyApplication gets /staff/my-application", async () => {
    mock.onGet("/staff/my-application").reply(200, { data: {} });
    const res = await staffService.getMyApplication();
    expect(res.status).toBe(200);
  });

  it("getRestaurantOrders delegates to the order restaurant endpoint", async () => {
    mock.onGet("/orders/restaurant/r1").reply(200, { data: [] });
    await staffService.getRestaurantOrders("r1", { status: "PENDING" });
    expect(mock.history.get[0]?.url).toBe("/orders/restaurant/r1");
    expect(mock.history.get[0]?.params).toEqual({ status: "PENDING" });
  });

  it("updateOrderStatus delegates to the order status endpoint", async () => {
    mock.onPatch("/orders/o1/status").reply(200, { data: {} });
    await staffService.updateOrderStatus("o1", "READY");
    expect(JSON.parse(mock.history.patch[0]?.data as string)).toMatchObject({
      status: "READY",
    });
  });

  it("getMenu gets the restaurant menu", async () => {
    mock.onGet("/menu/r1").reply(200, { data: [] });
    const res = await staffService.getMenu("r1");
    expect(res.status).toBe(200);
  });

  it("toggleMenuItemAvailability patches via the staff route", async () => {
    mock
      .onPatch("/staff/menu/r1/items/i1/availability")
      .reply(200, { data: {} });
    await staffService.toggleMenuItemAvailability("r1", "i1", true);
    expect(JSON.parse(mock.history.patch[0]?.data as string)).toEqual({
      is_available: true,
    });
  });

  it("cancelOrder delegates to the order cancel endpoint with a reason", async () => {
    mock.onPost("/orders/o1/cancel").reply(200, { data: {} });
    await staffService.cancelOrder("o1", "too busy");
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      reason: "too busy",
    });
  });

  it("rejects on a server error", async () => {
    mock.onGet("/staff/me").reply(500, { detail: "boom" });
    await expect(staffService.getMyProfile()).rejects.toBeTruthy();
  });

  it("rejects on a 403", async () => {
    mock.onGet("/menu/r1").reply(403, { detail: "denied" });
    await expect(staffService.getMenu("r1")).rejects.toBeTruthy();
  });
});
