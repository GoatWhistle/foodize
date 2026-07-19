import { describe, it, expect, vi, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { createApi } from "@shared/services/createApi";
import { API_BASE_URL } from "@shared/config";

describe("createApi", () => {
  let restoreCookie: (() => void) | null = null;

  afterEach(() => {
    restoreCookie?.();
    restoreCookie = null;
  });

  it("uses the shared base URL and json content type", () => {
    const api = createApi();
    expect(api.defaults.baseURL).toBe(API_BASE_URL);
    expect(api.defaults.headers["Content-Type"]).toBe("application/json");
    expect(api.defaults.withCredentials).toBe(false);
  });

  it("passes withCredentials through", () => {
    const api = createApi({ withCredentials: true });
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("attaches Authorization header from getToken and an X-Request-Id", async () => {
    const api = createApi({ getToken: () => "abc123" });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    let capturedAuth: unknown;
    let capturedReqId: unknown;
    mock.onGet("/ping").reply((config) => {
      capturedAuth = config.headers?.Authorization;
      capturedReqId = config.headers?.["X-Request-Id"];
      return [200, { ok: true }];
    });
    await api.get("/ping");
    expect(capturedAuth).toBe("Bearer abc123");
    expect(capturedReqId).toBeTruthy();
    mock.restore();
  });

  it("does not set Authorization when token is falsy", async () => {
    const api = createApi({ getToken: () => null });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    let capturedAuth: unknown = "unset";
    mock.onGet("/ping").reply((config) => {
      capturedAuth = config.headers?.Authorization;
      return [200, {}];
    });
    await api.get("/ping");
    expect(capturedAuth).toBeUndefined();
    mock.restore();
  });

  it("adds the CSRF header for mutating requests when the cookie is present", async () => {
    const original = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "cookie",
    );
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => "csrf_token=tok%20en",
    });
    restoreCookie = () => {
      if (original) Object.defineProperty(document, "cookie", original);
    };
    const api = createApi({ withCredentials: true });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    let capturedCsrf: unknown;
    mock.onPost("/mutate").reply((config) => {
      capturedCsrf = config.headers?.["X-CSRF-Token"];
      return [200, {}];
    });
    await api.post("/mutate", {});
    expect(capturedCsrf).toBe("tok en");
    mock.restore();
  });

  it("does not add CSRF header for GET requests", async () => {
    const original = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "cookie",
    );
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => "csrf_token=tok",
    });
    restoreCookie = () => {
      if (original) Object.defineProperty(document, "cookie", original);
    };
    const api = createApi({ withCredentials: true });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    let capturedCsrf: unknown = "unset";
    mock.onGet("/read").reply((config) => {
      capturedCsrf = config.headers?.["X-CSRF-Token"];
      return [200, {}];
    });
    await api.get("/read");
    expect(capturedCsrf).toBeUndefined();
    mock.restore();
  });

  it("normalizes a nested error detail object into a string", async () => {
    const api = createApi();
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock.onGet("/boom").reply(400, { detail: { error: "bad thing" } });
    await expect(api.get("/boom")).rejects.toMatchObject({
      response: { data: { detail: "bad thing" } },
    });
    mock.restore();
  });

  it("calls onUnauthorized on a 401 when no refresh is configured", async () => {
    const onUnauthorized = vi.fn();
    const api = createApi({ onUnauthorized });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock.onGet("/secure").reply(401, { detail: "Not authenticated" });
    await expect(api.get("/secure")).rejects.toBeTruthy();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    mock.restore();
  });

  it("refreshes the token and retries the original request on 401", async () => {
    const refreshToken = vi.fn().mockResolvedValue(undefined);
    const api = createApi({ refreshToken });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    let calls = 0;
    mock.onGet("/data").reply(() => {
      calls += 1;
      if (calls === 1) return [401, { detail: "Token has expired" }];
      return [200, { value: "ok" }];
    });
    const res = await api.get("/data");
    expect(res.data).toEqual({ value: "ok" });
    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(calls).toBe(2);
    mock.restore();
  });

  it("calls onUnauthorized and rejects when refresh fails", async () => {
    const refreshToken = vi.fn().mockRejectedValue(new Error("refresh failed"));
    const onUnauthorized = vi.fn();
    const api = createApi({ refreshToken, onUnauthorized });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock.onGet("/data").reply(401, { detail: "Token has expired" });
    await expect(api.get("/data")).rejects.toThrow("refresh failed");
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    mock.restore();
  });

  it("does not retry urls listed in skipRetryUrls", async () => {
    const refreshToken = vi.fn().mockResolvedValue(undefined);
    const onUnauthorized = vi.fn();
    const api = createApi({
      refreshToken,
      onUnauthorized,
      skipRetryUrls: ["/login"],
    });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock.onPost("/login").reply(401, { detail: "Invalid credentials" });
    await expect(api.post("/login", {})).rejects.toBeTruthy();
    expect(refreshToken).not.toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    mock.restore();
  });

  it("queues concurrent requests during a single refresh", async () => {
    let resolveRefresh: (() => void) | null = null;
    const refreshToken = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const api = createApi({ refreshToken });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    const attempts: Record<string, number> = {};
    mock.onGet("/a").reply(() => {
      attempts["a"] = (attempts["a"] ?? 0) + 1;
      return attempts["a"] === 1 ? [401, {}] : [200, { r: "a" }];
    });
    mock.onGet("/b").reply(() => {
      attempts["b"] = (attempts["b"] ?? 0) + 1;
      return attempts["b"] === 1 ? [401, {}] : [200, { r: "b" }];
    });
    const p1 = api.get("/a");
    const p2 = api.get("/b");
    await new Promise((r) => setTimeout(r, 10));
    (resolveRefresh as (() => void) | null)?.();
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.data).toEqual({ r: "a" });
    expect(r2.data).toEqual({ r: "b" });
    expect(refreshToken).toHaveBeenCalledTimes(1);
    mock.restore();
  });

  it("wraps a non-Error refresh rejection into an Error", async () => {
    const refreshToken = vi.fn().mockRejectedValue("string failure");
    const api = createApi({ refreshToken });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock.onGet("/data").reply(401, { detail: "expired" });
    await expect(api.get("/data")).rejects.toThrow("string failure");
    mock.restore();
  });

  it("skips the CSRF header when the cookie is absent", async () => {
    const original = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "cookie",
    );
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => "other=1",
    });
    restoreCookie = () => {
      if (original) Object.defineProperty(document, "cookie", original);
    };
    const api = createApi({ withCredentials: true });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    let capturedCsrf: unknown = "unset";
    mock.onPost("/mutate").reply((config) => {
      capturedCsrf = config.headers?.["X-CSRF-Token"];
      return [200, {}];
    });
    await api.post("/mutate", {});
    expect(capturedCsrf).toBeUndefined();
    mock.restore();
  });

  it("passes through a network error that has no response", async () => {
    const api = createApi();
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock.onGet("/net").networkError();
    await expect(api.get("/net")).rejects.toBeTruthy();
    mock.restore();
  });

  it("propagates non-401 errors without refresh", async () => {
    const refreshToken = vi.fn().mockResolvedValue(undefined);
    const api = createApi({ refreshToken });
    const mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock.onGet("/x").reply(500, { detail: "boom" });
    await expect(api.get("/x")).rejects.toBeTruthy();
    expect(refreshToken).not.toHaveBeenCalled();
    mock.restore();
  });
});
