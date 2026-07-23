import { AppState } from "react-native";
import type { AppStateStatus } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";
import { AppText } from "@/components/AppText";
import { SecurityProvider } from "@/components/SecurityProvider";
import { useSecurityStore } from "@/store/useSecurityStore";
import { requireBiometricUnlock } from "@/platform/biometricGate";
import { reportDeviceIntegrity } from "@/platform/deviceIntegrity";
import type { IntegrityReport } from "@/platform/deviceIntegrity";

jest.mock("@/platform/biometricGate", () => ({
  requireBiometricUnlock: jest.fn(),
}));

jest.mock("@/platform/deviceIntegrity", () => ({
  reportDeviceIntegrity: jest.fn(),
}));

const mockUnlock = jest.mocked(requireBiometricUnlock);
const mockIntegrity = jest.mocked(reportDeviceIntegrity);

const cleanReport: IntegrityReport = {
  compromised: false,
  isEmulator: false,
  isRooted: false,
  reasons: [],
};

describe("SecurityProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSecurityStore.setState({ biometricEnabled: false, unlocked: false });
    (AppState as unknown as { currentState: AppStateStatus }).currentState = "active";
    jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove: jest.fn() });
    mockUnlock.mockResolvedValue(true);
    mockIntegrity.mockResolvedValue(cleanReport);
  });

  it("renders children when biometrics are disabled", async () => {
    render(
      <SecurityProvider>
        <AppText>content</AppText>
      </SecurityProvider>,
    );
    expect(screen.getByText("content")).toBeTruthy();
    await waitFor(() => {
      expect(mockIntegrity).toHaveBeenCalled();
    });
    expect(mockUnlock).not.toHaveBeenCalled();
  });

  it("shows the lock screen and triggers unlock when biometrics are enabled and locked", async () => {
    useSecurityStore.setState({ biometricEnabled: true, unlocked: false });
    render(
      <SecurityProvider>
        <AppText>content</AppText>
      </SecurityProvider>,
    );
    expect(screen.getByTestId("biometric-lock")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
    await waitFor(() => {
      expect(mockUnlock).toHaveBeenCalled();
    });
  });

  it("renders children once unlocked", async () => {
    useSecurityStore.setState({ biometricEnabled: true, unlocked: true });
    render(
      <SecurityProvider>
        <AppText>content</AppText>
      </SecurityProvider>,
    );
    expect(screen.getByText("content")).toBeTruthy();
    await waitFor(() => {
      expect(mockUnlock).toHaveBeenCalled();
    });
  });

  it("shows the integrity banner when the device is compromised", async () => {
    mockIntegrity.mockResolvedValueOnce({
      compromised: true,
      isEmulator: false,
      isRooted: true,
      reasons: ["rooted"],
    });
    render(
      <SecurityProvider>
        <AppText>content</AppText>
      </SecurityProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("integrity-banner")).toBeTruthy();
    });
  });
});
