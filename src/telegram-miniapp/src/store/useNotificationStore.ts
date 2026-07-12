import { createNotificationStore } from "@shared/store/createNotificationStore";
import { logError } from "@shared/utils/logError";
import { createNotificationWebSocket } from "../services/api";

export const useNotificationStore = createNotificationStore({
  createNotificationWebSocket,
  onNewNotification: () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    } catch (err) {
      logError("notificationStore.haptic", err);
    }
  },
});
