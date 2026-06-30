import {
  getBackButton,
  getMainButton,
  getHapticFeedback,
  getColorScheme,
  tg,
} from "../telegram/sdk";

export function useTelegramWebApp() {
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
