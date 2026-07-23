import * as LocalAuthentication from "expo-local-authentication";
import {
  authenticateWithBiometrics,
  getBiometricAvailability,
  isBiometricAvailable,
} from "@/platform/biometrics";

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const mockHasHardware = jest.mocked(LocalAuthentication.hasHardwareAsync);
const mockIsEnrolled = jest.mocked(LocalAuthentication.isEnrolledAsync);
const mockAuthenticate = jest.mocked(LocalAuthentication.authenticateAsync);

describe("biometrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockHasHardware.mockResolvedValue(true);
    mockIsEnrolled.mockResolvedValue(true);
    mockAuthenticate.mockResolvedValue({ success: true } as never);
  });

  it("reports no_hardware when scanner is missing", async () => {
    mockHasHardware.mockResolvedValueOnce(false);
    expect(await getBiometricAvailability()).toBe("no_hardware");
  });

  it("reports not_enrolled when nothing is enrolled", async () => {
    mockIsEnrolled.mockResolvedValueOnce(false);
    expect(await getBiometricAvailability()).toBe("not_enrolled");
  });

  it("reports available when hardware and enrollment are present", async () => {
    expect(await getBiometricAvailability()).toBe("available");
    expect(await isBiometricAvailable()).toBe(true);
  });

  it("reports error when the hardware check throws", async () => {
    mockHasHardware.mockRejectedValue(new Error("boom"));
    expect(await getBiometricAvailability()).toBe("error");
    expect(await isBiometricAvailable()).toBe(false);
  });

  it("does not authenticate when biometrics are unavailable", async () => {
    mockHasHardware.mockResolvedValueOnce(false);
    const result = await authenticateWithBiometrics("prompt");
    expect(result).toEqual({ success: false, error: "no_hardware" });
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it("returns success when authentication succeeds", async () => {
    const result = await authenticateWithBiometrics("prompt");
    expect(result).toEqual({ success: true });
    expect(mockAuthenticate).toHaveBeenCalledWith(
      expect.objectContaining({ promptMessage: "prompt" }),
    );
  });

  it("returns the failure reason when authentication is rejected", async () => {
    mockAuthenticate.mockResolvedValueOnce({ success: false, error: "user_cancel" } as never);
    const result = await authenticateWithBiometrics("prompt");
    expect(result).toEqual({ success: false, error: "user_cancel" });
  });

  it("returns error when authenticateAsync throws", async () => {
    mockAuthenticate.mockRejectedValueOnce(new Error("native crash"));
    const result = await authenticateWithBiometrics("prompt");
    expect(result).toEqual({ success: false, error: "error" });
  });
});
