import { createNotificationStore } from "@shared/store/createNotificationStore.js";
import { createNotificationWebSocket } from "../services/api";

export const useNotificationStore = createNotificationStore({
  createNotificationWebSocket,
  onNewNotification: () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
    } catch {}
  },
});
