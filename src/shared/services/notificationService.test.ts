import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { notificationService } from "@shared/services/notificationService";

let mock: InstanceType<typeof MockAdapter>;

describe("notificationService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("getNotifications forwards params", async () => {
    mock.onGet("/notifications").reply(200, { data: [] });
    await notificationService.getNotifications({ page: 1 });
    expect(mock.history.get[0]?.params).toEqual({ page: 1 });
  });

  it("markAsRead posts to the read endpoint", async () => {
    mock.onPost("/notifications/n1/read").reply(200, { data: {} });
    const res = await notificationService.markAsRead("n1");
    expect(mock.history.post[0]?.url).toBe("/notifications/n1/read");
    expect(res.status).toBe(200);
  });

  it("markAllAsRead posts to read-all", async () => {
    mock.onPost("/notifications/read-all").reply(200, { data: null });
    const res = await notificationService.markAllAsRead();
    expect(res.status).toBe(200);
  });

  it("deleteNotification deletes a single notification", async () => {
    mock.onDelete("/notifications/n1").reply(200, { data: null });
    const res = await notificationService.deleteNotification("n1");
    expect(mock.history.delete[0]?.url).toBe("/notifications/n1");
    expect(res.status).toBe(200);
  });

  it("deleteAll deletes all notifications", async () => {
    mock.onDelete("/notifications").reply(200, { data: null });
    const res = await notificationService.deleteAll();
    expect(res.status).toBe(200);
  });

  it("rejects on an error", async () => {
    mock.onGet("/notifications").reply(500, { detail: "boom" });
    await expect(notificationService.getNotifications()).rejects.toBeTruthy();
  });
});
