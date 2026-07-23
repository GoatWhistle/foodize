import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";
import { useTranslation } from "@/i18n";
import type { OrderStatus } from "@shared/types/models";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  cancellationReason?: string | null;
}

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<OrderStatus, IconName> = {
  PENDING: "location",
  ACCEPTED: "flame",
  READY: "checkmark-circle",
  COMPLETED: "happy",
  CANCELLED: "close-circle",
};

export function OrderStatusBadge({
  status,
  cancellationReason,
}: OrderStatusBadgeProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();

  const colorForStatus: Record<OrderStatus, string> = {
    PENDING: theme.colors.warning,
    ACCEPTED: theme.colors.accent,
    READY: theme.colors.success,
    COMPLETED: theme.colors.success,
    CANCELLED: theme.colors.error,
  };

  const title =
    status === "PENDING"
      ? t("order.badge.pendingTitle")
      : status === "ACCEPTED"
        ? t("order.badge.acceptedTitle")
        : status === "READY"
          ? t("order.badge.readyTitle")
          : status === "COMPLETED"
            ? t("order.badge.completedTitle")
            : t("order.badge.cancelledTitle");

  const subtitle =
    status === "PENDING"
      ? t("order.badge.pendingSubtitle")
      : status === "ACCEPTED"
        ? t("order.badge.acceptedSubtitle")
        : status === "READY"
          ? t("order.badge.readySubtitle")
          : status === "COMPLETED"
            ? t("order.badge.completedSubtitle")
            : cancellationReason || t("order.badge.cancelledSubtitle");

  const color = colorForStatus[status];

  return (
    <View style={styles.wrap} testID={`order-status-${status}`}>
      <View
        style={[
          styles.iconRing,
          { backgroundColor: theme.colors.bgSurface, borderColor: color },
        ]}
      >
        <Ionicons name={ICONS[status]} size={44} color={color} />
      </View>
      <AppText variant="heading" style={[styles.title, { color }]}>
        {title}
      </AppText>
      <AppText variant="body" color="muted" style={styles.subtitle}>
        {subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
