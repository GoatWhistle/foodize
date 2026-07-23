import * as Device from "expo-device";
import { logError } from "@shared/utils/logError";
import { captureMessage } from "@/services/observability";

export interface IntegrityReport {
  compromised: boolean;
  isEmulator: boolean;
  isRooted: boolean;
  reasons: string[];
}

export async function checkDeviceIntegrity(): Promise<IntegrityReport> {
  const reasons: string[] = [];
  const isEmulator = !Device.isDevice;
  if (isEmulator) reasons.push("emulator");

  let isRooted = false;
  try {
    isRooted = await Device.isRootedExperimentalAsync();
    if (isRooted) reasons.push("rooted");
  } catch (error) {
    logError("deviceIntegrity.isRooted", error);
  }

  const compromised = isRooted;
  return { compromised, isEmulator, isRooted, reasons };
}

export async function reportDeviceIntegrity(): Promise<IntegrityReport> {
  const report = await checkDeviceIntegrity();
  if (report.compromised) {
    captureMessage("device.integrity.compromised", { reasons: report.reasons });
  }
  return report;
}
