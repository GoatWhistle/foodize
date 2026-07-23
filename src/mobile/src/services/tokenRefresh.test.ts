import { tokenRefresh } from "@/services/tokenRefresh";

const mockPost = jest.fn<Promise<unknown>, [string, unknown, unknown]>();
const mockGetRefreshToken = jest.fn<Promise<string | null>, []>();
const mockSetAccessToken = jest.fn<Promise<void>, [string]>();
const mockSetRefreshToken = jest.fn<Promise<void>, [string]>();

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    post: (url: string, body: unknown, config: unknown): Promise<unknown> =>
      mockPost(url, body, config),
  },
}));

jest.mock("@/platform/tokenStorage", () => ({
  tokenStorage: {
    getRefreshToken: (): Promise<string | null> => mockGetRefreshToken(),
    setAccessToken: (token: string): Promise<void> => mockSetAccessToken(token),
    setRefreshToken: (token: string): Promise<void> => mockSetRefreshToken(token),
  },
}));

describe("tokenRefresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetAccessToken.mockResolvedValue(undefined);
    mockSetRefreshToken.mockResolvedValue(undefined);
  });

  it("throws when there is no refresh token", async () => {
    mockGetRefreshToken.mockResolvedValue(null);
    await expect(tokenRefresh("https://api")).rejects.toThrow("No refresh token");
  });

  it("stores new tokens on success", async () => {
    mockGetRefreshToken.mockResolvedValue("old-refresh");
    mockPost.mockResolvedValue({
      data: { data: { access_token: "new-access", refresh_token: "new-refresh" } },
    });
    await tokenRefresh("https://api");
    expect(mockSetAccessToken).toHaveBeenCalledWith("new-access");
    expect(mockSetRefreshToken).toHaveBeenCalledWith("new-refresh");
  });

  it("dedupes concurrent refreshes into a single request", async () => {
    mockGetRefreshToken.mockResolvedValue("old-refresh");
    mockPost.mockResolvedValue({
      data: { data: { access_token: "a", refresh_token: "r" } },
    });
    await Promise.all([tokenRefresh("https://api"), tokenRefresh("https://api")]);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});
