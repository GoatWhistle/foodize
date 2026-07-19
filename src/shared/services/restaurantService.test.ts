import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { restaurantService } from "@shared/services/restaurantService";

let mock: InstanceType<typeof MockAdapter>;

describe("restaurantService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("getAll gets public restaurants with params", async () => {
    mock.onGet("/restaurants/public").reply(200, { data: [] });
    await restaurantService.getAll({ search: "pizza" });
    expect(mock.history.get[0]?.params).toEqual({ search: "pizza" });
  });

  it("getAll works without params", async () => {
    mock.onGet("/restaurants/public").reply(200, { data: [] });
    const res = await restaurantService.getAll();
    expect(res.status).toBe(200);
  });

  it("getById gets a single public restaurant", async () => {
    mock.onGet("/restaurants/public/r1").reply(200, { data: { id: "r1" } });
    const res = await restaurantService.getById("r1");
    expect(res.status).toBe(200);
  });

  it("getMy gets the vendor's restaurants", async () => {
    mock.onGet("/restaurants/").reply(200, { data: [] });
    const res = await restaurantService.getMy();
    expect(res.status).toBe(200);
  });

  it("create posts a new restaurant", async () => {
    mock.onPost("/restaurants/").reply(201, { data: { id: "r1" } });
    const res = await restaurantService.create({} as never);
    expect(res.status).toBe(201);
  });

  it("update patches a restaurant", async () => {
    mock.onPatch("/restaurants/r1").reply(200, { data: {} });
    await restaurantService.update("r1", { name: "New" });
    expect(mock.history.patch[0]?.url).toBe("/restaurants/r1");
  });

  it("getWorkingHours gets the working hours", async () => {
    mock.onGet("/restaurants/r1/working-hours").reply(200, { data: [] });
    const res = await restaurantService.getWorkingHours("r1");
    expect(res.status).toBe(200);
  });

  it("setWorkingHours puts wrapped hours", async () => {
    mock.onPut("/restaurants/r1/working-hours").reply(200, { data: [] });
    await restaurantService.setWorkingHours("r1", [{ day: 1 }] as never);
    expect(JSON.parse(mock.history.put[0]?.data as string)).toEqual({
      hours: [{ day: 1 }],
    });
  });

  it("uploadPhoto posts multipart form data", async () => {
    mock.onPost("/restaurants/r1/photo").reply(200, { data: {} });
    const file = new File(["x"], "p.png", { type: "image/png" });
    await restaurantService.uploadPhoto("r1", file);
    expect(mock.history.post[0]?.data).toBeInstanceOf(FormData);
    expect(mock.history.post[0]?.headers?.["Content-Type"]).toBe(
      "multipart/form-data",
    );
  });

  it("deletePhoto deletes the photo", async () => {
    mock.onDelete("/restaurants/r1/photo").reply(200, { data: {} });
    const res = await restaurantService.deletePhoto("r1");
    expect(res.status).toBe(200);
  });

  it("rejects on a server error", async () => {
    mock.onGet("/restaurants/public/r1").reply(500, { detail: "boom" });
    await expect(restaurantService.getById("r1")).rejects.toBeTruthy();
  });
});
