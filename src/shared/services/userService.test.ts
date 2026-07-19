import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { userService } from "@shared/services/userService";

let mock: InstanceType<typeof MockAdapter>;

describe("userService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("getById gets a public user profile", async () => {
    mock.onGet("/users/u1").reply(200, { data: { id: "u1" } });
    const res = await userService.getById("u1");
    expect(res.status).toBe(200);
    expect(mock.history.get[0]?.url).toBe("/users/u1");
  });

  it("updateMe patches the current user", async () => {
    mock.onPatch("/users/me").reply(200, { data: {} });
    await userService.updateMe({ name: "Иван" });
    expect(JSON.parse(mock.history.patch[0]?.data as string)).toEqual({
      name: "Иван",
    });
  });

  it("changePassword posts to the change-password endpoint", async () => {
    mock.onPost("/users/me/change-password").reply(200, { data: null });
    const res = await userService.changePassword({} as never);
    expect(res.status).toBe(200);
  });

  it("rejects on an error", async () => {
    mock.onGet("/users/u1").reply(404, { detail: "not found" });
    await expect(userService.getById("u1")).rejects.toBeTruthy();
  });
});
