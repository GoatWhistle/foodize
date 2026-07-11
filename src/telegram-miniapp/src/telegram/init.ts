import axios from "axios";
import { authService } from "../services/authService";
import { expandApp, getStartParam, getTelegramInitData, readyApp } from "./sdk";

export interface InitTelegramAppResult {
  status: string;
  start_param: string;
  initData?: string;
  phone_number?: string | null;
}

function describeError(err: unknown): { status?: number; message?: string } {
  if (axios.isAxiosError(err)) {
    return { status: err.response?.status, message: err.message };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return {};
}

export async function initTelegramApp(): Promise<InitTelegramAppResult> {
  expandApp();

  const initData = getTelegramInitData();
  const startParam = getStartParam();

  if (!initData) {
    readyApp();
    return { status: "no_init_data", start_param: startParam };
  }

  try {
    const resp = await authService.telegramCheck(initData);
    const result = resp.data.data;
    readyApp();
    return {
      status: result.status,
      phone_number: result.phone_number,
      initData,
      start_param: startParam,
    };
  } catch (err) {
    const { status, message } = describeError(err);
    console.error("[initTelegramApp] failed:", status, message);
    readyApp();
    return { status: "error", start_param: startParam };
  }
}

export async function completeTelegramAuth(
  initData: string,
  phoneNumber: string,
  name: string,
): Promise<void> {
  try {
    await authService.telegramRegister(initData, phoneNumber, name);
  } catch (err) {
    const { status, message } = describeError(err);
    console.warn("[completeTelegramAuth] failed:", status, message);
    throw err;
  }
}

export async function authExistingUser(initData: string): Promise<void> {
  try {
    await authService.telegramAuth(initData);
  } catch (err) {
    const { status, message } = describeError(err);
    console.warn("[authExistingUser] failed:", status, message);
    throw err;
  }
}
