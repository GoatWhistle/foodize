import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAuthStore } from "@shared/store/createAuthStore";
import { authService } from "@shared/services/authService";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import { tokenStorage } from "@/platform/tokenStorage";
import { useCartStore } from "@/store/useCartStore";
import { useOrdersStore } from "@/store/useOrdersStore";

export const useAuthStore = createAuthStore({
  authService,
  persistKey: "auth-storage",
  storage: AsyncStorage,
  onLogout: () => {
    void tokenStorage.clear();
    useCartStore.setState({ cart: [], cartRestaurantId: null });
    useOrdersStore.setState({ activeOrder: null, currentOrder: null, orders: [] });
    useFavoriteStore.setState({ favoriteIds: [], loaded: false });
  },
});
