import { authService } from "../services/authService";
import { expandApp, getStartParam, getTelegramInitData, readyApp } from "./sdk";

export async function initTelegramApp() {
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
    console.error("[initTelegramApp] failed:", err?.response?.status, err?.message);
    readyApp();
    return { status: "error", start_param: startParam };
  }
}

export async function completeTelegramAuth(initData, phoneNumber, name) {
  const resp = await authService.telegramRegister(initData, phoneNumber, name);
  const { access_token, refresh_token } = resp.data.data;
  sessionStorage.setItem("access_token", access_token);
  sessionStorage.setItem("refresh_token", refresh_token);
  return resp.data.data;
}

export async function authExistingUser(initData) {
  const resp = await authService.telegramAuth(initData);
  const { access_token, refresh_token } = resp.data.data;
  sessionStorage.setItem("access_token", access_token);
  sessionStorage.setItem("refresh_token", refresh_token);
  return resp.data.data;
}
