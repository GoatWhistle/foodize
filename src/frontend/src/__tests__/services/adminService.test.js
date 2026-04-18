import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import api from "../../services/api";
import { adminService } from "../../services/adminService";

describe("adminService", () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it("getUsers sends GET to /admin/users", async () => {
    const mockData = { data: [], total: 0 };
    mock.onGet("/admin/users").reply(200, mockData);

    const result = await adminService.getUsers({ page: 1, size: 20 });
    expect(result.data).toEqual(mockData);
  });

  it("getUser sends GET to /admin/users/{id}", async () => {
    const mockData = { id: "1", name: "Test Admin" };
    mock.onGet("/admin/users/1").reply(200, mockData);

    const result = await adminService.getUser("1");
    expect(result.data).toEqual(mockData);
  });

  it("deleteUser sends DELETE to /admin/users/{id}", async () => {
    mock.onDelete("/admin/users/1").reply(204);

    const result = await adminService.deleteUser("1");
    expect(result.status).toEqual(204);
  });

  it("getOrders sends GET to /admin/orders", async () => {
    const mockData = { data: [], total: 0 };
    mock.onGet("/admin/orders").reply(200, mockData);

    const result = await adminService.getOrders({ page: 1, size: 20 });
    expect(result.data).toEqual(mockData);
  });

  it("getPlatformStats sends GET to /admin/stats", async () => {
    const mockData = { total_users: 10 };
    mock.onGet("/admin/stats").reply(200, mockData);

    const result = await adminService.getPlatformStats();
    expect(result.data).toEqual(mockData);
  });
});
