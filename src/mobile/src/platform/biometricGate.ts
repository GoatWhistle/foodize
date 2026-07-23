import { tokenStorage } from "@/platform/tokenStorage";
import { useSecurityStore } from "@/store/useSecurityStore";
import { authenticateWithBiometrics, isBiometricAvailable } from "@/platform/biometrics";

export async function requireBiometricUnlock(promptMessage: string): Promise<boolean> {
  const { biometricEnabled, setUnlocked } = useSecurityStore.getState();
  if (!biometricEnabled) {
    setUnlocked(true);
    return true;
  }
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    setUnlocked(true);
    return true;
  }
  const available = await isBiometricAvailable();
  if (!available) {
    setUnlocked(true);
    return true;
  }
  const result = await authenticateWithBiometrics(promptMessage);
  setUnlocked(result.success);
  return result.success;
}
