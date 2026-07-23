import * as Device from "expo-device";
import { captureMessage } from "@/services/observability";
import { checkDeviceIntegrity, reportDeviceIntegrity } from "@/platform/deviceIntegrity";

const deviceState = { isDevice: true };
jest.mock("expo-device", () => ({
  get isDevice() {
    return deviceState.isDevice;
  },
  isRootedExperimentalAsync: jest.fn(),
}));

jest.mock("@/services/observability", () => ({
  captureMessage: jest.fn(),
}));

const mockIsRooted = jest.mocked(Device.isRootedExperimentalAsync);
const mockCaptureMessage = jest.mocked(captureMessage);

describe("deviceIntegrity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    deviceState.isDevice = true;
    mockIsRooted.mockResolvedValue(false);
  });

  it("reports a clean device", async () => {
    const report = await checkDeviceIntegrity();
    expect(report).toEqual({
      compromised: false,
      isEmulator: false,
      isRooted: false,
      reasons: [],
    });
  });

  it("flags an emulator without marking it compromised", async () => {
    deviceState.isDevice = false;
    const report = await checkDeviceIntegrity();
    expect(report.isEmulator).toBe(true);
    expect(report.compromised).toBe(false);
    expect(report.reasons).toContain("emulator");
  });

  it("flags a rooted device as compromised", async () => {
    mockIsRooted.mockResolvedValueOnce(true);
    const report = await checkDeviceIntegrity();
    expect(report.compromised).toBe(true);
    expect(report.reasons).toContain("rooted");
  });

  it("swallows root-check errors", async () => {
    mockIsRooted.mockRejectedValueOnce(new Error("nope"));
    const report = await checkDeviceIntegrity();
    expect(report.compromised).toBe(false);
    expect(report.isRooted).toBe(false);
  });

  it("captures a message when compromised", async () => {
    mockIsRooted.mockResolvedValueOnce(true);
    const report = await reportDeviceIntegrity();
    expect(report.compromised).toBe(true);
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      "device.integrity.compromised",
      expect.objectContaining({ reasons: ["rooted"] }),
    );
  });

  it("does not capture a message for a clean device", async () => {
    await reportDeviceIntegrity();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });
});
