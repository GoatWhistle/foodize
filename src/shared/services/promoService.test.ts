import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { promoService } from "@shared/services/promoService";

let mock: InstanceType<typeof MockAdapter>;

describe("promoService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("validate posts the full payload with defaults", async () => {
    mock.onPost("/promos/validate").reply(200, { data: { valid: true } });
    await promoService.validate("SAVE10", "r1");
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      code: "SAVE10",
      restaurant_id: "r1",
      order_total: 0,
      is_first_order: false,
    });
  });

  it("validate forwards explicit total and first-order flag", async () => {
    mock.onPost("/promos/validate").reply(200, { data: {} });
    await promoService.validate("SAVE10", "r1", 500, true);
    expect(JSON.parse(mock.history.post[0]?.data as string)).toMatchObject({
      order_total: 500,
      is_first_order: true,
    });
  });

  it("create posts to /promos", async () => {
    mock.onPost("/promos").reply(201, { data: { id: "p1" } });
    const res = await promoService.create({} as never);
    expect(res.status).toBe(201);
  });

  it("list forwards params", async () => {
    mock.onGet("/promos").reply(200, { data: [] });
    await promoService.list({ is_active: true });
    expect(mock.history.get[0]?.params).toEqual({ is_active: true });
  });

  it("deactivate deletes by code", async () => {
    mock.onDelete("/promos/SAVE10").reply(200, { data: null });
    const res = await promoService.deactivate("SAVE10");
    expect(mock.history.delete[0]?.url).toBe("/promos/SAVE10");
    expect(res.status).toBe(200);
  });

  it("rejects on a validation error", async () => {
    mock.onPost("/promos/validate").reply(422, { detail: "bad" });
    await expect(promoService.validate("X", "r1")).rejects.toBeTruthy();
  });

  it("rejects on a server error for list", async () => {
    mock.onGet("/promos").reply(500, { detail: "boom" });
    await expect(promoService.list()).rejects.toBeTruthy();
  });
});
