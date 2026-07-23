import { createNotificationStore } from "@shared/store/createNotificationStore";
import { createNotificationWebSocket } from "@/services/api";

export const useNotificationStore = createNotificationStore({
  createNotificationWebSocket,
});
