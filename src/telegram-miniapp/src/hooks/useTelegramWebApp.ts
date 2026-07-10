import {
  getBackButton,
  getMainButton,
  getHapticFeedback,
  getColorScheme,
  tg,
  type TelegramWebApp,
  type TelegramColorScheme,
  type TelegramBackButton,
  type TelegramMainButton,
  type TelegramHapticFeedback,
} from "../telegram/sdk";

export interface UseTelegramWebAppResult {
  tg: TelegramWebApp | null;
  colorScheme: TelegramColorScheme;
  BackButton: TelegramBackButton | null;
  MainButton: TelegramMainButton | null;
  HapticFeedback: TelegramHapticFeedback | null;
  close: () => void;
  showAlert: (msg: string, cb?: () => void) => void;
  showConfirm: (msg: string, cb?: (confirmed: boolean) => void) => void;
}

export function useTelegramWebApp(): UseTelegramWebAppResult {
  return {
    tg,
    colorScheme: getColorScheme(),
    BackButton: getBackButton(),
    MainButton: getMainButton(),
    HapticFeedback: getHapticFeedback(),
    close: () => tg?.close(),
    showAlert: (msg, cb) => tg?.showAlert(msg, cb),
    showConfirm: (msg, cb) => tg?.showConfirm(msg, cb),
  };
}
