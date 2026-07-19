import { createAuthStore } from "@shared/store/createAuthStore";
import { authService } from "@shared/services/authService";

export const useAuthStore = createAuthStore({ authService });
