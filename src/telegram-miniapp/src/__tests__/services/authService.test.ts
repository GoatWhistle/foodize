import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const postMock = vi.hoisted(() => vi.fn());
vi.mock("../../services/api", () => ({
  api: { post: (...args: unknown[]) => postMock(...args) as Promise<unknown> },
}));

const createAuthServiceMock = vi.hoisted(() =>
  vi.fn((deps: { logout: () => unknown }) => ({ __deps: deps })),
);
vi.mock("@shared/services/authService", () => ({
  createAuthService: (deps: { logout: () => unknown }) =>
    createAuthServiceMock(deps),
}));

import { authService } from "../../services/authService";

const created = createAuthServiceMock as unknown as Mock;

describe("miniapp authService", () => {
  beforeEach(() => {
    postMock.mockClear();
  });

  it("builds an auth service via the shared factory", () => {
    expect(created).toHaveBeenCalledTimes(1);
    expect(authService).toBeDefined();
  });

  it("wires the cookie session-logout endpoint into the logout dep", () => {
    const deps = created.mock.calls[0]?.[0] as { logout: () => unknown };
    expect(typeof deps.logout).toBe("function");

    deps.logout();

    expect(postMock).toHaveBeenCalledWith("/telegram/session-logout");
  });
});
