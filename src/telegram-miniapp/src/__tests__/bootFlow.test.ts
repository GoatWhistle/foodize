import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";

import { runBootFlow, type BootFlowDeps } from "../telegram/bootFlow";
import { initTelegramApp, authExistingUser } from "../telegram/init";

vi.mock("../telegram/init", () => ({
  initTelegramApp: vi.fn(),
  authExistingUser: vi.fn(),
}));

const initTelegramAppMock = initTelegramApp as unknown as Mock;
const authExistingUserMock = authExistingUser as unknown as Mock;

function makeDeps(overrides: Partial<BootFlowDeps> = {}): BootFlowDeps {
  return {
    fetchMe: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: vi.fn().mockReturnValue(false),
    isForcedLogout: vi.fn().mockReturnValue(false),
    ...overrides,
  };
}

describe("runBootFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses session cookie without re-authenticating by initData", async () => {
    initTelegramAppMock.mockResolvedValueOnce({
      status: "registered",
      start_param: "restaurant_1",
      initData: "same_init_data",
    });

    let authed = false;
    const fetchMe = vi.fn().mockImplementation(() => {
      authed = true;
      return Promise.resolve();
    });
    const deps = makeDeps({
      fetchMe,
      isAuthenticated: () => authed,
    });

    const action = await runBootFlow(deps);

    expect(action).toEqual({ type: "ready", startParam: "restaurant_1" });
    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(authExistingUserMock).not.toHaveBeenCalled();
  });

  it("falls back to initData auth when session cookie is invalid", async () => {
    initTelegramAppMock.mockResolvedValueOnce({
      status: "registered",
      start_param: "",
      initData: "init",
    });

    let authed = false;
    const fetchMe = vi.fn().mockImplementation(async () => {});
    authExistingUserMock.mockImplementation(() => {
      authed = true;
      return Promise.resolve();
    });

    const deps = makeDeps({
      fetchMe,
      isAuthenticated: () => authed,
    });

    const action = await runBootFlow(deps);

    expect(action.type).toBe("ready");
    expect(authExistingUserMock).toHaveBeenCalledWith("init");
    expect(fetchMe).toHaveBeenCalledTimes(2);
  });

  it("goes to login when forced logout even with active session", async () => {
    initTelegramAppMock.mockResolvedValueOnce({
      status: "registered",
      start_param: "",
      initData: "init",
    });

    const deps = makeDeps({
      isForcedLogout: () => true,
    });

    const action = await runBootFlow(deps);

    expect(action).toEqual({ type: "login", initData: "init" });
    expect(authExistingUserMock).not.toHaveBeenCalled();
  });

  it("returns register action for new users", async () => {
    initTelegramAppMock.mockResolvedValueOnce({
      status: "new_user",
      start_param: "restaurant_9",
      initData: "init",
      phone_number: "+700",
    });

    const action = await runBootFlow(makeDeps());

    expect(action).toEqual({
      type: "register",
      initData: "init",
      phoneNumber: "+700",
      startParam: "restaurant_9",
    });
  });

  it("defaults initData to empty string on forced logout when init data is absent", async () => {
    initTelegramAppMock.mockResolvedValueOnce({
      status: "registered",
      start_param: "",
    });

    const action = await runBootFlow(makeDeps({ isForcedLogout: () => true }));

    expect(action).toEqual({ type: "login", initData: "" });
  });

  it("authenticates with an empty init data string when the result has none", async () => {
    initTelegramAppMock.mockResolvedValueOnce({
      status: "registered",
      start_param: "",
    });
    let authed = false;
    authExistingUserMock.mockImplementation(() => {
      authed = true;
      return Promise.resolve();
    });

    const action = await runBootFlow(
      makeDeps({ isAuthenticated: () => authed }),
    );

    expect(authExistingUserMock).toHaveBeenCalledWith("");
    expect(action.type).toBe("ready");
  });

  it("defaults phone and init data to null/empty for a new user with missing fields", async () => {
    initTelegramAppMock.mockResolvedValueOnce({
      status: "new_user",
      start_param: "",
    });

    const action = await runBootFlow(makeDeps());

    expect(action).toEqual({
      type: "register",
      initData: "",
      phoneNumber: null,
      startParam: "",
    });
  });

  it("returns a bare ready action when unauthenticated and status is not registered/new", async () => {
    initTelegramAppMock.mockResolvedValueOnce({
      status: "no_init_data",
      start_param: "",
      initData: "",
    });

    const action = await runBootFlow(makeDeps({ isAuthenticated: () => false }));

    expect(action).toEqual({ type: "ready" });
    expect(authExistingUserMock).not.toHaveBeenCalled();
  });

  it("throws when initData auth does not authenticate", async () => {
    initTelegramAppMock.mockResolvedValueOnce({
      status: "registered",
      start_param: "",
      initData: "init",
    });
    authExistingUserMock.mockResolvedValue(undefined);

    const deps = makeDeps({ isAuthenticated: () => false });

    await expect(runBootFlow(deps)).rejects.toThrow();
  });
});
