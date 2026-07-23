import { useSecurityStore } from "@/store/useSecurityStore";
import { authenticateWithBiometrics, isBiometricAvailable } from "@/platform/biometrics";
import { requireBiometricUnlock } from "@/platform/biometricGate";

const mockGetRefresh = jest.fn<Promise<string | null>, []>();

jest.mock("@/platform/tokenStorage", () => ({
  tokenStorage: { getRefreshToken: () => mockGetRefresh() },
}));

jest.mock("@/platform/biometrics", () => ({
  authenticateWithBiometrics: jest.fn(),
  isBiometricAvailable: jest.fn(),
}));

const mockAvailable = jest.mocked(isBiometricAvailable);
const mockAuthenticate = jest.mocked(authenticateWithBiometrics);

describe("requireBiometricUnlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSecurityStore.setState({ biometricEnabled: true, unlocked: false });
    mockGetRefresh.mockResolvedValue("refresh-token");
    mockAvailable.mockResolvedValue(true);
    mockAuthenticate.mockResolvedValue({ success: true });
  });

  it("unlocks immediately when biometrics are disabled", async () => {
    useSecurityStore.setState({ biometricEnabled: false, unlocked: false });
    expect(await requireBiometricUnlock("prompt")).toBe(true);
    expect(useSecurityStore.getState().unlocked).toBe(true);
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it("unlocks when there is no stored refresh token", async () => {
    mockGetRefresh.mockResolvedValueOnce(null);
    expect(await requireBiometricUnlock("prompt")).toBe(true);
    expect(useSecurityStore.getState().unlocked).toBe(true);
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it("unlocks when biometrics are unavailable", async () => {
    mockAvailable.mockResolvedValueOnce(false);
    expect(await requireBiometricUnlock("prompt")).toBe(true);
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it("prompts and unlocks on success", async () => {
    expect(await requireBiometricUnlock("prompt")).toBe(true);
    expect(mockAuthenticate).toHaveBeenCalledWith("prompt");
    expect(useSecurityStore.getState().unlocked).toBe(true);
  });

  it("stays locked when authentication fails", async () => {
    mockAuthenticate.mockResolvedValueOnce({ success: false, error: "user_cancel" });
    expect(await requireBiometricUnlock("prompt")).toBe(false);
    expect(useSecurityStore.getState().unlocked).toBe(false);
  });
});
