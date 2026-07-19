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

export interface TelegramSafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramInitDataUnsafe;
  colorScheme: TelegramColorScheme;
  themeParams: TelegramThemeParams;
  viewportHeight: number;
  safeAreaInset?: TelegramSafeAreaInset;
  contentSafeAreaInset?: TelegramSafeAreaInset;
  BackButton: TelegramBackButton;
  MainButton: TelegramMainButton;
  HapticFeedback: TelegramHapticFeedback;
  expand: () => void;
  ready: () => void;
  close: () => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  requestContact: (callback: (granted: boolean) => void) => void;
  onEvent: (eventType: string, handler: () => void) => void;
  offEvent: (eventType: string, handler: () => void) => void;
}

export const tg: TelegramWebApp | null =
  (window.Telegram?.WebApp as TelegramWebApp | undefined) ?? null;

let cachedInitData = "";

export function getTelegramInitData(): string {
  const initData = tg?.initData ?? "";
  if (initData) {
    cachedInitData = initData;
    return initData;
  }

  return cachedInitData;
}

export function clearTelegramInitData(): void {
  cachedInitData = "";
}

export function getTelegramUser(): TelegramWebAppUser | null {
  return tg?.initDataUnsafe.user ?? null;
}

export function getStartParam(): string {
  return tg?.initDataUnsafe.start_param ?? "";
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
      resolve(granted);
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

export const hapticSelection = (): void => {
  tg?.HapticFeedback.selectionChanged();
};

export const hapticImpact = (
  style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light",
): void => {
  tg?.HapticFeedback.impactOccurred(style);
};

export function startTelegramApp(): void {
  if (!tg) return;
  tg.ready();
  tg.expand();
}

export function enableClosingConfirmation(): void {
  tg?.enableClosingConfirmation?.();
}

export function disableClosingConfirmation(): void {
  tg?.disableClosingConfirmation?.();
}

const EMPTY_INSET: TelegramSafeAreaInset = { top: 0, bottom: 0, left: 0, right: 0 };

function writeInsetVars(prefix: string, inset: TelegramSafeAreaInset): void {
  const root = document.documentElement.style;
  root.setProperty(`${prefix}-top`, `${inset.top}px`);
  root.setProperty(`${prefix}-bottom`, `${inset.bottom}px`);
  root.setProperty(`${prefix}-left`, `${inset.left}px`);
  root.setProperty(`${prefix}-right`, `${inset.right}px`);
}

export function applySafeAreaInsets(): void {
  if (typeof document === "undefined") return;
  writeInsetVars("--tg-safe-area-inset", tg?.safeAreaInset ?? EMPTY_INSET);
  writeInsetVars(
    "--tg-content-safe-area-inset",
    tg?.contentSafeAreaInset ?? EMPTY_INSET,
  );
}

export function subscribeSafeAreaInsets(): () => void {
  applySafeAreaInsets();
  if (!tg) return () => {};
  const handler = () => { applySafeAreaInsets(); };
  tg.onEvent("safeAreaChanged", handler);
  tg.onEvent("contentSafeAreaChanged", handler);
  return () => {
    tg.offEvent("safeAreaChanged", handler);
    tg.offEvent("contentSafeAreaChanged", handler);
  };
}
