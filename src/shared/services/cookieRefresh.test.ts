import { describe, it, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { cookieRefresh } from "@shared/services/cookieRefresh";

let mock: InstanceType<typeof MockAdapter>;

describe("cookieRefresh", () => {
  beforeEach(() => {
    mock = new MockAdapter(axios, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("posts with credentials and a request id header", async () => {
    mock.onPost("https://api.example/refresh").reply(200, {});
    await cookieRefresh("https://api.example", "/refresh");
    expect(mock.history.post[0]?.withCredentials).toBe(true);
    expect(mock.history.post[0]?.headers?.["X-Request-Id"]).toBeTruthy();
  });

  it("deduplicates concurrent refreshes for the same key", async () => {
    let calls = 0;
    mock.onPost("https://api.example/refresh").reply(() => {
      calls += 1;
      return [200, {}];
    });
    const a = cookieRefresh("https://api.example", "/refresh");
    const b = cookieRefresh("https://api.example", "/refresh");
    expect(a).toBe(b);
    await Promise.all([a, b]);
    expect(calls).toBe(1);
  });

  it("clears the in-flight entry so a later call refetches", async () => {
    let calls = 0;
    mock.onPost("https://api.example/refresh").reply(() => {
      calls += 1;
      return [200, {}];
    });
    await cookieRefresh("https://api.example", "/refresh");
    await cookieRefresh("https://api.example", "/refresh");
    expect(calls).toBe(2);
  });

  it("propagates and clears on failure", async () => {
    mock.onPost("https://api.example/refresh").reply(401, {});
    await expect(
      cookieRefresh("https://api.example", "/refresh"),
    ).rejects.toBeTruthy();
  });
});
