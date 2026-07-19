import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "@shared/services/api.instance";
import { authService, createAuthService } from "@shared/services/authService";

let mock: InstanceType<typeof MockAdapter>;

describe("authService", () => {
  beforeEach(() => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mock.restore();
  });

  it("register posts to /register", async () => {
    mock.onPost("/register").reply(201, { data: {} });
    await authService.register({} as never);
    expect(mock.history.post[0]?.url).toBe("/register");
  });

  it("login posts to /login", async () => {
    mock.onPost("/login").reply(200, { data: {} });
    const res = await authService.login({} as never);
    expect(res.status).toBe(200);
  });

  it("getMe gets the current user", async () => {
    mock.onGet("/users/me").reply(200, { data: { id: "u1" } });
    const res = await authService.getMe();
    expect(res.status).toBe(200);
  });

  it("logout posts to /logout by default", async () => {
    mock.onPost("/logout").reply(200, { data: null });
    const res = await authService.logout();
    expect(mock.history.post[0]?.url).toBe("/logout");
    expect((res as { status: number }).status).toBe(200);
  });

  it("createAuthService uses an injected logout instead of the default", async () => {
    const customLogout = vi.fn(() => Promise.resolve("done"));
    const service = createAuthService({ logout: customLogout });
    const result = await service.logout();
    expect(customLogout).toHaveBeenCalled();
    expect(result).toBe("done");
  });

  it("requestTelegramLoginCode posts to the request-code endpoint", async () => {
    mock
      .onPost("/telegram/site-login/request-code")
      .reply(200, { data: {} });
    const res = await authService.requestTelegramLoginCode({} as never);
    expect(res.status).toBe(200);
  });

  it("requestTelegramLoginCodeByUsername posts to the by-username endpoint", async () => {
    mock
      .onPost("/telegram/site-login/request-code-by-username")
      .reply(200, { data: {} });
    const res = await authService.requestTelegramLoginCodeByUsername(
      {} as never,
    );
    expect(res.status).toBe(200);
  });

  it("verifyTelegramLoginCode posts to the verify endpoint", async () => {
    mock.onPost("/telegram/site-login/verify").reply(200, { data: {} });
    const res = await authService.verifyTelegramLoginCode({} as never);
    expect(res.status).toBe(200);
  });

  it("verifyTelegramLoginCodeByUsername posts to the verify-by-username endpoint", async () => {
    mock
      .onPost("/telegram/site-login/verify-by-username")
      .reply(200, { data: {} });
    const res = await authService.verifyTelegramLoginCodeByUsername(
      {} as never,
    );
    expect(res.status).toBe(200);
  });

  it("setTelegramSitePassword posts to the password endpoint", async () => {
    mock.onPost("/telegram/site-login/password").reply(200, { data: {} });
    const res = await authService.setTelegramSitePassword({ password: "p" });
    expect(res.status).toBe(200);
  });

  it("telegramLogout posts to /telegram/logout", async () => {
    mock.onPost("/telegram/logout").reply(200, { data: null });
    const res = await authService.telegramLogout();
    expect(res.status).toBe(200);
  });

  it("telegramCheck wraps init data", async () => {
    mock.onPost("/telegram/check").reply(200, { data: { status: "ok" } });
    await authService.telegramCheck("init123");
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      init_data: "init123",
    });
  });

  it("telegramRegister wraps registration data", async () => {
    mock.onPost("/telegram/register").reply(200, { data: {} });
    await authService.telegramRegister("init", "+7900", "Иван");
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      init_data: "init",
      phone_number: "+7900",
      name: "Иван",
    });
  });

  it("telegramAuth wraps init data", async () => {
    mock.onPost("/telegram/auth").reply(200, { data: {} });
    await authService.telegramAuth("init");
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      init_data: "init",
    });
  });

  it("rejects on a server error", async () => {
    mock.onGet("/users/me").reply(401, { detail: "unauthorized" });
    await expect(authService.getMe()).rejects.toBeTruthy();
  });
});
