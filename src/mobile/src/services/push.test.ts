import { registerDeviceToken, unregisterDeviceToken } from "@/services/push";
import { getExpoPushToken } from "@/platform/pushNotifications";
import { api } from "@/services/api";

jest.mock("@/services/api", () => ({
  api: { post: jest.fn(), delete: jest.fn() },
}));

jest.mock("@/platform/pushNotifications", () => ({
  getExpoPushToken: jest.fn(),
}));

const mockedApi = jest.mocked(api);
const mockedToken = jest.mocked(getExpoPushToken);

describe("push service", () => {
  beforeEach(async () => {
    mockedApi.delete.mockResolvedValue({});
    await unregisterDeviceToken();
    jest.clearAllMocks();
  });

  it("returns unregistered when there is no token", async () => {
    mockedToken.mockResolvedValueOnce(null);
    const result = await registerDeviceToken("ru");
    expect(result).toEqual({ token: null, registered: false });
    expect(mockedApi.post.mock.calls).toHaveLength(0);
  });

  it("registers the token on the backend", async () => {
    mockedToken.mockResolvedValueOnce("ExponentPushToken[abc]");
    mockedApi.post.mockResolvedValueOnce({});
    const result = await registerDeviceToken("ru");
    expect(result).toEqual({ token: "ExponentPushToken[abc]", registered: true });
    expect(mockedApi.post.mock.calls[0]).toEqual([
      "/notifications/devices",
      expect.objectContaining({ token: "ExponentPushToken[abc]", language: "ru" }),
    ]);
    await unregisterDeviceToken();
  });

  it("sends a null language when none is provided", async () => {
    mockedToken.mockResolvedValueOnce("ExponentPushToken[abc]");
    mockedApi.post.mockResolvedValueOnce({});
    await registerDeviceToken();
    expect(mockedApi.post.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ language: null }),
    );
    await unregisterDeviceToken();
  });

  it("degrades gracefully when the backend endpoint is missing", async () => {
    mockedToken.mockResolvedValueOnce("ExponentPushToken[abc]");
    mockedApi.post.mockRejectedValueOnce({ response: { status: 404 } });
    const result = await registerDeviceToken();
    expect(result).toEqual({ token: "ExponentPushToken[abc]", registered: false });
  });

  it("does nothing on unregister when no token was registered", async () => {
    await unregisterDeviceToken();
    expect(mockedApi.delete.mock.calls).toHaveLength(0);
  });

  it("unregisters a previously registered token", async () => {
    mockedToken.mockResolvedValueOnce("ExponentPushToken[abc]");
    mockedApi.post.mockResolvedValueOnce({});
    await registerDeviceToken();
    mockedApi.delete.mockResolvedValueOnce({});
    await unregisterDeviceToken();
    expect(mockedApi.delete.mock.calls[0]?.[0]).toBe(
      "/notifications/devices/ExponentPushToken%5Babc%5D",
    );
  });

  it("swallows unregister errors", async () => {
    mockedToken.mockResolvedValueOnce("ExponentPushToken[xyz]");
    mockedApi.post.mockResolvedValueOnce({});
    await registerDeviceToken();
    mockedApi.delete.mockRejectedValueOnce(new Error("boom"));
    await expect(unregisterDeviceToken()).resolves.toBeUndefined();
  });
});
