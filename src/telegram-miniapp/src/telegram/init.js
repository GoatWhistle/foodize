import { authService } from "../services/authService";
import { expandApp, getTelegramInitData, readyApp } from "./sdk";

export async function initTelegramApp() {
  readyApp();
  expandApp();

  const initData = getTelegramInitData();
  if (!initData) {
    return { status: "no_init_data" };
  }

  try {
    const resp = await authService.telegramCheck(initData);
    const result = resp.data.data;
    return {
      status: result.status,
      phone_number: result.phone_number,
      initData,
    };
  } catch {
    return { status: "error" };
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
