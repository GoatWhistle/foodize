import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useShallow } from "zustand/react/shallow";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { Button, Divider, EmptyState, IconButton } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { CartSheet } from "@/components/domain/CartSheet";
import { useCartStore } from "@/store/useCartStore";
import { getOptionIds } from "@shared/utils/cartLine";
import type { CartLine } from "@shared/utils/cartLine";
import { formatPrice } from "@shared/utils/price";
import { translateApiError } from "@shared/utils/translateApiError";
import { t } from "@/i18n";
import { useTheme } from "@/theme/useTheme";

export function CartScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { cart, cartRestaurantId, addToCart, removeFromCart, clearCart, placeOrder, orderPlacing } =
    useCartStore(
      useShallow((s) => ({
        cart: s.cart,
        cartRestaurantId: s.cartRestaurantId,
        addToCart: s.addToCart,
        removeFromCart: s.removeFromCart,
        clearCart: s.clearCart,
        placeOrder: s.placeOrder,
        orderPlacing: s.orderPlacing,
      })),
    );
  const total = useCartStore((s) => s.cartTotal());
  const [error, setError] = useState<string | null>(null);

  const handleIncrease = (line: CartLine): void => {
    if (!cartRestaurantId) return;
    void addToCart(line.menuItem, cartRestaurantId, line.selectedOptions, 1);
  };

  const handleDecrease = (line: CartLine): void => {
    void removeFromCart(line.menuItem.id, getOptionIds(line));
  };

  const handleCheckout = async (): Promise<void> => {
    setError(null);
    try {
      const order = await placeOrder();
      if (order) {
        router.replace({ pathname: "/order/[id]", params: { id: order.id } });
      }
    } catch (err) {
      setError(translateApiError(err, t("order.checkout.failed")));
    }
  };

  if (cart.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="cart-outline"
          title={t("order.list.emptyTitle")}
          description={t("order.list.emptySubtitle")}
          actionLabel={t("order.list.chooseVenue")}
          onAction={() => {
            router.replace("/(tabs)");
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <AppText variant="title">{t("order.cart.title")}</AppText>
        <IconButton
          accessibilityLabel={t("order.cart.clear")}
          testID="cart-clear"
          onPress={() => {
            void clearCart();
          }}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
        </IconButton>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <CartSheet
          cart={cart}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          testID="cart-sheet"
        />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Divider />
        <View style={styles.totalRow}>
          <AppText variant="heading">{t("order.cart.total")}</AppText>
          <AppText variant="heading" color="accent">
            {formatPrice(total)}
          </AppText>
        </View>
        {error ? (
          <AppText variant="caption" style={{ color: theme.colors.error }} testID="cart-error">
            {error}
          </AppText>
        ) : null}
        <Button
          title={
            orderPlacing
              ? t("order.checkout.placing")
              : t("order.checkout.submit", { total: formatPrice(total) })
          }
          loading={orderPlacing}
          testID="cart-checkout"
          onPress={() => {
            void handleCheckout();
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  content: {
    padding: 16,
  },
  footer: {
    padding: 16,
    gap: 12,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
