import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { BiometricToggle } from "@/components/domain/BiometricToggle";
import { useSecurityStore } from "@/store/useSecurityStore";
import {
  authenticateWithBiometrics,
  getBiometricAvailability,
} from "@/platform/biometrics";

jest.mock("@/platform/biometrics", () => ({
  getBiometricAvailability: jest.fn(),
  authenticateWithBiometrics: jest.fn(),
}));

const mockAvailability = jest.mocked(getBiometricAvailability);
const mockAuthenticate = jest.mocked(authenticateWithBiometrics);

const flushAvailability = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe("BiometricToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSecurityStore.setState({ biometricEnabled: false, unlocked: false });
    mockAvailability.mockResolvedValue("available");
    mockAuthenticate.mockResolvedValue({ success: true });
  });

  it("enables biometrics after a successful prompt", async () => {
    render(<BiometricToggle />);
    await flushAvailability();
    fireEvent(screen.getByTestId("biometric-toggle"), "valueChange", true);
    await waitFor(() => {
      expect(useSecurityStore.getState().biometricEnabled).toBe(true);
    });
    expect(mockAuthenticate).toHaveBeenCalled();
  });

  it("does not enable biometrics when the prompt fails", async () => {
    mockAuthenticate.mockResolvedValueOnce({ success: false, error: "user_cancel" });
    render(<BiometricToggle />);
    await flushAvailability();
    fireEvent(screen.getByTestId("biometric-toggle"), "valueChange", true);
    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalled();
    });
    expect(useSecurityStore.getState().biometricEnabled).toBe(false);
  });

  it("disables biometrics without a prompt", async () => {
    useSecurityStore.setState({ biometricEnabled: true, unlocked: true });
    render(<BiometricToggle />);
    await flushAvailability();
    fireEvent(screen.getByTestId("biometric-toggle"), "valueChange", false);
    await waitFor(() => {
      expect(useSecurityStore.getState().biometricEnabled).toBe(false);
    });
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it("ignores enable attempts and shows a hint when there is no hardware", async () => {
    mockAvailability.mockResolvedValueOnce("no_hardware");
    render(<BiometricToggle />);
    await flushAvailability();
    fireEvent(screen.getByTestId("biometric-toggle"), "valueChange", true);
    await flushAvailability();
    expect(mockAuthenticate).not.toHaveBeenCalled();
    expect(screen.getByText("Биометрия недоступна на этом устройстве")).toBeTruthy();
  });

  it("shows an enrollment hint when not enrolled", async () => {
    mockAvailability.mockResolvedValueOnce("not_enrolled");
    render(<BiometricToggle />);
    await waitFor(() => {
      expect(
        screen.getByText("Добавьте Face ID или отпечаток в настройках устройства"),
      ).toBeTruthy();
    });
  });
});
