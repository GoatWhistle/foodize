export const tg = window.Telegram?.WebApp ?? null;

export function getTelegramInitData() {
  return tg?.initData ?? "";
}

export function getTelegramUser() {
  return tg?.initDataUnsafe?.user ?? null;
}

export function expandApp() {
  tg?.expand();
}

export function readyApp() {
  tg?.ready();
}

export function getColorScheme() {
  return tg?.colorScheme ?? "light";
}

export function getThemeParams() {
  return tg?.themeParams ?? {};
}

export function closeApp() {
  tg?.close();
}

export function showAlert(message, callback) {
  tg?.showAlert(message, callback);
}

export function showConfirm(message, callback) {
  tg?.showConfirm(message, callback);
}

export const BackButton = tg?.BackButton ?? null;
export const MainButton = tg?.MainButton ?? null;
export const HapticFeedback = tg?.HapticFeedback ?? null;
