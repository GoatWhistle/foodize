import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";
import { useTranslation } from "@/i18n";
import { getCustomerOrderStatusLabel } from "@shared/utils/orderStatus";
import { formatPrice } from "@shared/utils/price";
import type { BadgeTone } from "@/components/ui";
import type { Order, OrderStatus } from "@shared/types/models";

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

const TONE_FOR_STATUS: Record<OrderStatus, BadgeTone> = {
  PENDING: "warning",
  ACCEPTED: "accent",
  READY: "success",
  COMPLETED: "neutral",
  CANCELLED: "error",
};

const formatOrderDate = (value: string | null | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday
    ? date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

export function OrderCard({ order, onPress }: OrderCardProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const tone = TONE_FOR_STATUS[order.status];
  const statusColor: Record<BadgeTone, string> = {
    neutral: theme.colors.text2,
    accent: theme.colors.accent,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
  };

  return (
    <Card {...(onPress ? { onPress } : {})} testID={`order-card-${order.id}`}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: theme.colors.accentSubtle }]}>
          <Ionicons name="storefront" size={20} color={theme.colors.accent} />
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <AppText variant="body" style={styles.orderId}>
              #{order.display_id}
            </AppText>
            {order.restaurant_name ? (
              <AppText variant="caption" color="muted" numberOfLines={1} style={styles.venue}>
                {order.restaurant_name}
              </AppText>
            ) : null}
          </View>
          <View style={styles.bottomRow}>
            <AppText
              variant="caption"
              style={[styles.status, { color: statusColor[tone] }]}
            >
              {getCustomerOrderStatusLabel(order.status)}
            </AppText>
            <AppText variant="caption" color="muted">
              {t("order.card.positionsCount", { count: order.items.length })}
            </AppText>
          </View>
        </View>

        <View style={styles.right}>
          <AppText variant="body" style={styles.price}>
            {formatPrice(order.total_price)}
          </AppText>
          <AppText variant="caption" color="muted">
            {formatOrderDate(order.created_at)}
          </AppText>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.colors.text3} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderId: {
    fontWeight: "700",
  },
  venue: {
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  status: {
    fontWeight: "600",
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  price: {
    fontWeight: "700",
  },
});
