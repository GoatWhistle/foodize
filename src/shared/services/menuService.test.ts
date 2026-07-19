import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { menuService } from "@shared/services/menuService";

let mock: InstanceType<typeof MockAdapter>;

describe("menuService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("getMenu gets the restaurant menu with params", async () => {
    mock.onGet("/menu/r1").reply(200, { data: [] });
    await menuService.getMenu("r1", { category: "PIZZA" });
    expect(mock.history.get[0]?.url).toBe("/menu/r1");
    expect(mock.history.get[0]?.params).toEqual({ category: "PIZZA" });
  });

  it("addItem posts to the items endpoint", async () => {
    mock.onPost("/menu/r1/items").reply(201, { data: { id: "i1" } });
    const res = await menuService.addItem("r1", {} as never);
    expect(res.status).toBe(201);
  });

  it("updateItem patches an item", async () => {
    mock.onPatch("/menu/r1/items/i1").reply(200, { data: {} });
    await menuService.updateItem("r1", "i1", {});
    expect(mock.history.patch[0]?.url).toBe("/menu/r1/items/i1");
  });

  it("deleteItem deletes an item", async () => {
    mock.onDelete("/menu/r1/items/i1").reply(200, { data: null });
    const res = await menuService.deleteItem("r1", "i1");
    expect(res.status).toBe(200);
  });

  it("createOptionGroup posts to the option-groups endpoint", async () => {
    mock.onPost("/menu/r1/items/i1/option-groups").reply(201, { data: {} });
    const res = await menuService.createOptionGroup("r1", "i1", {} as never);
    expect(res.status).toBe(201);
  });

  it("updateOptionGroup patches a group", async () => {
    mock
      .onPatch("/menu/r1/items/i1/option-groups/g1")
      .reply(200, { data: {} });
    await menuService.updateOptionGroup("r1", "i1", "g1", {});
    expect(mock.history.patch[0]?.url).toBe(
      "/menu/r1/items/i1/option-groups/g1",
    );
  });

  it("deleteOptionGroup deletes a group", async () => {
    mock
      .onDelete("/menu/r1/items/i1/option-groups/g1")
      .reply(200, { data: null });
    const res = await menuService.deleteOptionGroup("r1", "i1", "g1");
    expect(res.status).toBe(200);
  });

  it("createOption posts to the options endpoint", async () => {
    mock
      .onPost("/menu/r1/items/i1/option-groups/g1/options")
      .reply(201, { data: {} });
    const res = await menuService.createOption("r1", "i1", "g1", {} as never);
    expect(res.status).toBe(201);
  });

  it("updateOption patches an option", async () => {
    mock
      .onPatch("/menu/r1/items/i1/option-groups/g1/options/o1")
      .reply(200, { data: {} });
    await menuService.updateOption("r1", "i1", "g1", "o1", {});
    expect(mock.history.patch[0]?.url).toBe(
      "/menu/r1/items/i1/option-groups/g1/options/o1",
    );
  });

  it("deleteOption deletes an option", async () => {
    mock
      .onDelete("/menu/r1/items/i1/option-groups/g1/options/o1")
      .reply(200, { data: null });
    const res = await menuService.deleteOption("r1", "i1", "g1", "o1");
    expect(res.status).toBe(200);
  });

  it("toggleAvailability patches availability with the flag", async () => {
    mock.onPatch("/menu/r1/items/i1/availability").reply(200, { data: {} });
    await menuService.toggleAvailability("r1", "i1", false);
    expect(JSON.parse(mock.history.patch[0]?.data as string)).toEqual({
      is_available: false,
    });
  });

  it("uploadItemPhoto posts multipart form data", async () => {
    mock.onPost("/menu/r1/items/i1/photo").reply(200, { data: {} });
    const file = new File(["x"], "photo.png", { type: "image/png" });
    await menuService.uploadItemPhoto("r1", "i1", file);
    expect(mock.history.post[0]?.data).toBeInstanceOf(FormData);
    expect(mock.history.post[0]?.headers?.["Content-Type"]).toBe(
      "multipart/form-data",
    );
  });

  it("deleteItemPhoto deletes the photo", async () => {
    mock.onDelete("/menu/r1/items/i1/photo").reply(200, { data: {} });
    const res = await menuService.deleteItemPhoto("r1", "i1");
    expect(res.status).toBe(200);
  });

  it("rejects on a server error", async () => {
    mock.onGet("/menu/r1").reply(500, { detail: "boom" });
    await expect(menuService.getMenu("r1")).rejects.toBeTruthy();
  });

  it("rejects on a 404", async () => {
    mock.onPatch("/menu/r1/items/i1").reply(404, { detail: "Menu item not found" });
    await expect(
      menuService.updateItem("r1", "i1", {}),
    ).rejects.toBeTruthy();
  });
});
