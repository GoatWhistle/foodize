import * as LocalAuthentication from "expo-local-authentication";
import { logError } from "@shared/utils/logError";

export type BiometricAvailability =
  | "available"
  | "no_hardware"
  | "not_enrolled"
  | "error";

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return "no_hardware";
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return "not_enrolled";
    return "available";
  } catch (error) {
    logError("biometrics.getBiometricAvailability", error);
    return "error";
  }
}

export async function isBiometricAvailable(): Promise<boolean> {
  return (await getBiometricAvailability()) === "available";
}

export async function authenticateWithBiometrics(
  promptMessage: string,
): Promise<BiometricAuthResult> {
  const availability = await getBiometricAvailability();
  if (availability !== "available") {
    return { success: false, error: availability };
  }
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      disableDeviceFallback: false,
    });
    if (result.success) return { success: true };
    return { success: false, error: result.error };
  } catch (error) {
    logError("biometrics.authenticateWithBiometrics", error);
    return { success: false, error: "error" };
  }
}
