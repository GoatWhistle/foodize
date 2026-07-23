import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { loyaltyService } from "@shared/services/loyaltyService";
import type { LoyaltyProgramUpsert } from "@shared/types/models";

let mock: InstanceType<typeof MockAdapter>;

describe("loyaltyService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("getProgram requests the vendor program by restaurant", async () => {
    mock.onGet("/loyalty/programs/r1").reply(200, { data: { id: "lp1" } });
    const res = await loyaltyService.getProgram("r1");
    expect(res.data.data).toEqual({ id: "lp1" });
  });

  it("upsertProgram puts the payload", async () => {
    mock.onPut("/loyalty/programs/r1").reply(200, { data: { id: "lp1" } });
    const payload: LoyaltyProgramUpsert = {
      type: "CASHBACK",
      is_active: true,
      tier_basis: "ORDERS",
      max_redeem_percent: 100,
      tiers: [{ name: "Base", threshold: 0, cashback_percent: 5 }],
    };
    await loyaltyService.upsertProgram("r1", payload);
    expect(JSON.parse(mock.history.put[0]?.data as string)).toEqual(payload);
  });

  it("getStatus requests the customer status", async () => {
    mock.onGet("/loyalty/restaurants/r1/status").reply(200, { data: { points_balance: 10 } });
    const res = await loyaltyService.getStatus("r1");
    expect(res.data.data).toEqual({ points_balance: 10 });
  });

  it("rejects on a not found program", async () => {
    mock.onGet("/loyalty/programs/r1").reply(404, {
      detail: { code: "LOYALTY_PROGRAM_NOT_FOUND" },
    });
    await expect(loyaltyService.getProgram("r1")).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
