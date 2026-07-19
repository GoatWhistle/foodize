import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { favoriteService } from "@shared/services/favoriteService";

let mock: InstanceType<typeof MockAdapter>;

describe("favoriteService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("getAll forwards params", async () => {
    mock.onGet("/favorites").reply(200, { data: [] });
    await favoriteService.getAll({ size: 100 });
    expect(mock.history.get[0]?.params).toEqual({ size: 100 });
  });

  it("add posts to the restaurant favorite endpoint", async () => {
    mock.onPost("/favorites/r1").reply(201, { data: {} });
    const res = await favoriteService.add("r1");
    expect(mock.history.post[0]?.url).toBe("/favorites/r1");
    expect(res.status).toBe(201);
  });

  it("remove deletes the favorite", async () => {
    mock.onDelete("/favorites/r1").reply(200, { data: null });
    const res = await favoriteService.remove("r1");
    expect(mock.history.delete[0]?.url).toBe("/favorites/r1");
    expect(res.status).toBe(200);
  });

  it("rejects on an error", async () => {
    mock.onPost("/favorites/r1").reply(409, { detail: "exists" });
    await expect(favoriteService.add("r1")).rejects.toBeTruthy();
  });
});
