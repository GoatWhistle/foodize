import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { captureError, captureMessage, initObservability } from "@/services/observability";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  wrap: (component: unknown) => component,
}));

const mockedInit = jest.mocked(Sentry.init);
const mockedCapture = jest.mocked(Sentry.captureException);
const mockedMessage = jest.mocked(Sentry.captureMessage);

describe("observability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Constants as { expoConfig?: { extra?: { sentryDsn?: string } } }).expoConfig = {
      extra: {},
    };
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  });

  it("does not init Sentry without a DSN", () => {
    initObservability();
    expect(mockedInit).not.toHaveBeenCalled();
  });

  it("does not capture errors before init", () => {
    captureError(new Error("x"));
    expect(mockedCapture).not.toHaveBeenCalled();
  });

  it("does not capture messages before init", () => {
    captureMessage("hi");
    expect(mockedMessage).not.toHaveBeenCalled();
  });

  it("inits from the env DSN and captures with context", () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://key@sentry.io/1";
    initObservability();
    expect(mockedInit).toHaveBeenCalledTimes(1);
    captureError(new Error("boom"), { orderId: "o1" });
    expect(mockedCapture).toHaveBeenCalledWith(expect.any(Error), {
      extra: { orderId: "o1" },
    });
  });

  it("captures messages with and without context after init", () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://key@sentry.io/1";
    initObservability();
    captureMessage("compromised", { flag: true });
    expect(mockedMessage).toHaveBeenCalledWith("compromised", { extra: { flag: true } });
    captureMessage("plain");
    expect(mockedMessage).toHaveBeenLastCalledWith("plain", undefined);
  });
});
