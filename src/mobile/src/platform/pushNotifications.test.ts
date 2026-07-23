import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  configureAndroidChannels,
  configureNotificationHandler,
  ensurePushPermission,
  getExpoPushToken,
  notificationBehavior,
  setBadgeCount,
  subscribeToNotifications,
} from "@/platform/pushNotifications";

const deviceState = { isDevice: true };
jest.mock("expo-device", () => ({
  get isDevice() {
    return deviceState.isDevice;
  },
}));

const mockedGetPermissions = jest.mocked(Notifications.getPermissionsAsync);
const mockedRequestPermissions = jest.mocked(Notifications.requestPermissionsAsync);
const mockedGetToken = jest.mocked(Notifications.getExpoPushTokenAsync);
const mockedSetHandler = jest.mocked(Notifications.setNotificationHandler);
const mockedSetChannel = jest.mocked(Notifications.setNotificationChannelAsync);
const mockedReceived = jest.mocked(Notifications.addNotificationReceivedListener);
const mockedResponse = jest.mocked(Notifications.addNotificationResponseReceivedListener);
const mockedSetBadge = jest.mocked(Notifications.setBadgeCountAsync);

const grant = (status: string): { status: string } => ({ status });

describe("pushNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deviceState.isDevice = true;
    Platform.OS = "android";
    mockedGetPermissions.mockResolvedValue(grant("undetermined") as never);
    mockedRequestPermissions.mockResolvedValue(grant("granted") as never);
    mockedGetToken.mockResolvedValue({ data: "ExponentPushToken[test]" } as never);
  });

  it("returns false permission when not a device", async () => {
    deviceState.isDevice = false;
    expect(await ensurePushPermission()).toBe(false);
  });

  it("returns true when permission already granted", async () => {
    mockedGetPermissions.mockResolvedValueOnce(grant("granted") as never);
    expect(await ensurePushPermission()).toBe(true);
    expect(mockedRequestPermissions).not.toHaveBeenCalled();
  });

  it("requests permission when undetermined and returns granted result", async () => {
    expect(await ensurePushPermission()).toBe(true);
    expect(mockedRequestPermissions).toHaveBeenCalled();
  });

  it("returns null token when not a device", async () => {
    deviceState.isDevice = false;
    expect(await getExpoPushToken()).toBeNull();
  });

  it("returns null token when permission denied", async () => {
    mockedGetPermissions.mockResolvedValueOnce(grant("denied") as never);
    mockedRequestPermissions.mockResolvedValueOnce(grant("denied") as never);
    expect(await getExpoPushToken()).toBeNull();
  });

  it("returns an expo push token when granted, configures handler and channels", async () => {
    mockedGetPermissions.mockResolvedValueOnce(grant("granted") as never);
    const token = await getExpoPushToken();
    expect(token).toBe("ExponentPushToken[test]");
    expect(mockedSetHandler).toHaveBeenCalled();
  });

  it("returns null and logs when token retrieval throws", async () => {
    mockedGetPermissions.mockResolvedValueOnce(grant("granted") as never);
    mockedGetToken.mockRejectedValueOnce(new Error("boom"));
    expect(await getExpoPushToken()).toBeNull();
  });

  it("skips android channels on ios", async () => {
    Platform.OS = "ios";
    await configureAndroidChannels();
    expect(mockedSetChannel).not.toHaveBeenCalled();
  });

  it("does not reconfigure android channels once configured", async () => {
    await configureAndroidChannels();
    const countAfterFirst = mockedSetChannel.mock.calls.length;
    await configureAndroidChannels();
    expect(mockedSetChannel.mock.calls.length).toBe(countAfterFirst);
  });

  it("does not reconfigure the notification handler once configured", () => {
    configureNotificationHandler();
    const countAfterFirst = mockedSetHandler.mock.calls.length;
    configureNotificationHandler();
    expect(mockedSetHandler.mock.calls.length).toBe(countAfterFirst);
  });

  it("exposes the notification banner behavior", async () => {
    expect(await notificationBehavior()).toMatchObject({
      shouldShowBanner: true,
      shouldSetBadge: true,
    });
  });

  it("subscribes and unsubscribes listeners", () => {
    const remove = jest.fn();
    const subscription = { remove } as unknown as Notifications.EventSubscription;
    mockedReceived.mockReturnValueOnce(subscription);
    mockedResponse.mockReturnValueOnce(subscription);
    const unsub = subscribeToNotifications({
      onReceived: jest.fn(),
      onResponse: jest.fn(),
    });
    unsub();
    expect(remove).toHaveBeenCalledTimes(2);
  });

  it("subscribes with no listeners without crashing", () => {
    const unsub = subscribeToNotifications({});
    expect(() => { unsub(); }).not.toThrow();
  });

  it("sets the badge count", async () => {
    await setBadgeCount(3);
    expect(mockedSetBadge).toHaveBeenCalledWith(3);
  });

  it("swallows badge count errors", async () => {
    mockedSetBadge.mockRejectedValueOnce(new Error("nope"));
    await expect(setBadgeCount(1)).resolves.toBeUndefined();
  });
});
