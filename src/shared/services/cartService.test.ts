import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { cartService } from "@shared/services/cartService";

let mock: InstanceType<typeof MockAdapter>;

describe("cartService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("getCart gets /cart", async () => {
    mock.onGet("/cart").reply(200, { data: { items: [] } });
    const res = await cartService.getCart();
    expect(res.status).toBe(200);
  });

  it("updateCart posts the cart payload", async () => {
    mock.onPost("/cart").reply(200, { data: {} });
    await cartService.updateCart({ restaurant_id: "r1", items: [] });
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      restaurant_id: "r1",
      items: [],
    });
  });

  it("clearCart deletes /cart", async () => {
    mock.onDelete("/cart").reply(200, { data: {} });
    const res = await cartService.clearCart();
    expect(mock.history.delete[0]?.url).toBe("/cart");
    expect(res.status).toBe(200);
  });

  it("rejects on an error", async () => {
    mock.onGet("/cart").reply(500, { detail: "boom" });
    await expect(cartService.getCart()).rejects.toBeTruthy();
  });
});
