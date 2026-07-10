export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  phone_number?: string;
  [key: string]: unknown;
}

export interface TelegramInitDataUnsafe {
  user?: TelegramWebAppUser;
  start_param?: string;
  [key: string]: unknown;
}

export interface TelegramHapticFeedback {
  impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
  notificationOccurred: (type: "error" | "success" | "warning") => void;
  selectionChanged: () => void;
}

export interface TelegramBackButton {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

export interface TelegramMainButton {
  text: string;
  isVisible: boolean;
  isActive: boolean;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  setText: (text: string) => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

export type TelegramColorScheme = "light" | "dark";

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  [key: string]: string | undefined;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramInitDataUnsafe;
  colorScheme: TelegramColorScheme;
  themeParams: TelegramThemeParams;
  viewportHeight: number;
  BackButton: TelegramBackButton;
  MainButton: TelegramMainButton;
  HapticFeedback: TelegramHapticFeedback;
  expand: () => void;
  ready: () => void;
  close: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  requestContact: (callback: (granted: boolean) => void) => void;
  onEvent: (eventType: string, handler: () => void) => void;
  offEvent: (eventType: string, handler: () => void) => void;
}

export const tg: TelegramWebApp | null =
  (window.Telegram?.WebApp as TelegramWebApp | undefined) ?? null;

export const TELEGRAM_INIT_DATA_STORAGE_KEY = "foodize_tg_init_data";

export function getTelegramInitData(): string {
  const initData = tg?.initData ?? "";
  if (initData) {
    sessionStorage.setItem(TELEGRAM_INIT_DATA_STORAGE_KEY, initData);
    return initData;
  }

  return sessionStorage.getItem(TELEGRAM_INIT_DATA_STORAGE_KEY) ?? "";
}

export function clearTelegramInitData(): void {
  sessionStorage.removeItem(TELEGRAM_INIT_DATA_STORAGE_KEY);
}

export function getTelegramUser(): TelegramWebAppUser | null {
  return tg?.initDataUnsafe?.user ?? null;
}

export function getStartParam(): string {
  return tg?.initDataUnsafe?.start_param ?? "";
}

export function expandApp(): void {
  tg?.expand();
}

export function readyApp(): void {
  tg?.ready();
}

export function getColorScheme(): TelegramColorScheme {
  return tg?.colorScheme ?? "light";
}

export function getThemeParams(): TelegramThemeParams {
  return tg?.themeParams ?? {};
}

export function closeApp(): void {
  tg?.close();
}

export function showAlert(message: string, callback?: () => void): void {
  tg?.showAlert(message, callback);
}

export function showConfirm(
  message: string,
  callback?: (confirmed: boolean) => void,
): void {
  tg?.showConfirm(message, callback);
}

export function requestTelegramContact(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!tg?.requestContact) {
      reject(new Error("Telegram contact request is not available"));
      return;
    }

    tg.requestContact((granted) => {
      resolve(Boolean(granted));
    });
  });
}

export const BackButton: TelegramBackButton | null = tg?.BackButton ?? null;
export const MainButton: TelegramMainButton | null = tg?.MainButton ?? null;
export const HapticFeedback: TelegramHapticFeedback | null =
  tg?.HapticFeedback ?? null;

export const getBackButton = (): TelegramBackButton | null =>
  tg?.BackButton ?? null;
export const getMainButton = (): TelegramMainButton | null =>
  tg?.MainButton ?? null;
export const getHapticFeedback = (): TelegramHapticFeedback | null =>
  tg?.HapticFeedback ?? null;
