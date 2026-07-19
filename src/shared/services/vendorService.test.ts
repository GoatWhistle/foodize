import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { vendorService } from "@shared/services/vendorService";

let mock: InstanceType<typeof MockAdapter>;

describe("vendorService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("createProfile posts to /vendors/", async () => {
    mock.onPost("/vendors/").reply(201, { data: { id: "v1" } });
    const res = await vendorService.createProfile({});
    expect(res.data).toEqual({ data: { id: "v1" } });
    expect(mock.history.post[0]?.url).toBe("/vendors/");
  });

  it("getMyProfile gets /vendors/", async () => {
    mock.onGet("/vendors/").reply(200, { data: { id: "v1" } });
    const res = await vendorService.getMyProfile();
    expect(res.status).toBe(200);
  });

  it("getFinance forwards params", async () => {
    mock.onGet("/vendors/finance").reply(200, { data: {} });
    await vendorService.getFinance({ date_from: "2026-01-01" });
    expect(mock.history.get[0]?.params).toEqual({ date_from: "2026-01-01" });
  });

  it("getAdvancedAnalytics gets /vendors/analytics", async () => {
    mock.onGet("/vendors/analytics").reply(200, { data: {} });
    const res = await vendorService.getAdvancedAnalytics();
    expect(res.status).toBe(200);
  });

  it("getStaffRequests gets /staff/my-requests", async () => {
    mock.onGet("/staff/my-requests").reply(200, { data: [] });
    const res = await vendorService.getStaffRequests();
    expect(res.status).toBe(200);
  });

  it("updateStaffStatus patches the request status", async () => {
    mock.onPatch("/staff/requests/req1/status").reply(200, { data: {} });
    await vendorService.updateStaffStatus("req1", "APPROVED" as never);
    expect(JSON.parse(mock.history.patch[0]?.data as string)).toEqual({
      status: "APPROVED",
    });
  });

  it("getStaffMembers gets /staff/my-members", async () => {
    mock.onGet("/staff/my-members").reply(200, { data: [] });
    const res = await vendorService.getStaffMembers();
    expect(res.status).toBe(200);
  });

  it("removeStaffMember deletes the member", async () => {
    mock.onDelete("/staff/members/p1").reply(200, { data: null });
    const res = await vendorService.removeStaffMember("p1");
    expect(mock.history.delete[0]?.url).toBe("/staff/members/p1");
    expect(res.status).toBe(200);
  });

  it("exportOrdersCSV unwraps the blob body", async () => {
    const blob = new Blob(["a,b"], { type: "text/csv" });
    mock.onGet("/vendors/export/orders.csv").reply(200, blob);
    const result = await vendorService.exportOrdersCSV();
    expect(result).toBe(blob);
  });

  it("exportFinancePDF unwraps the blob body", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    mock.onGet("/vendors/export/finance.pdf").reply(200, blob);
    const result = await vendorService.exportFinancePDF();
    expect(result).toBe(blob);
  });

  it("exportMenuCSV unwraps the blob body", async () => {
    const blob = new Blob(["m"], { type: "text/csv" });
    mock.onGet("/vendors/export/menu.csv").reply(200, blob);
    expect(await vendorService.exportMenuCSV()).toBe(blob);
  });

  it("exportPromosCSV unwraps the blob body", async () => {
    const blob = new Blob(["p"], { type: "text/csv" });
    mock.onGet("/vendors/export/promos.csv").reply(200, blob);
    expect(await vendorService.exportPromosCSV()).toBe(blob);
  });

  it("exportAnalyticsPDF unwraps the blob body", async () => {
    const blob = new Blob(["a"], { type: "application/pdf" });
    mock.onGet("/vendors/export/analytics.pdf").reply(200, blob);
    expect(await vendorService.exportAnalyticsPDF()).toBe(blob);
  });

  it("getStaffRequests and getStaffMembers forward params", async () => {
    mock.onGet("/staff/my-requests").reply(200, { data: [] });
    mock.onGet("/staff/my-members").reply(200, { data: [] });
    await vendorService.getStaffRequests({ status: "PENDING" });
    await vendorService.getStaffMembers({ page: 1 });
    expect(mock.history.get[0]?.params).toEqual({ status: "PENDING" });
    expect(mock.history.get[1]?.params).toEqual({ page: 1 });
  });

  it("rejects on a server error", async () => {
    mock.onGet("/vendors/").reply(500, { detail: "boom" });
    await expect(vendorService.getMyProfile()).rejects.toBeTruthy();
  });

  it("rejects on a 4xx error", async () => {
    mock.onGet("/vendors/analytics").reply(403, { detail: "denied" });
    await expect(vendorService.getAdvancedAnalytics()).rejects.toBeTruthy();
  });
});
