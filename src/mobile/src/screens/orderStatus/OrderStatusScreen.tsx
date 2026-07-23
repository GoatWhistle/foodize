import { Fragment, useCallback, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import * as Haptics from "expo-haptics";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { Card, Divider, ErrorState, Skeleton } from "@/components/ui";
import { OrderStatusBadge } from "@/components/domain/OrderStatusBadge";
import { useTheme } from "@/theme/useTheme";
import { t } from "@/i18n";
import { createOrderWebSocket } from "@/services/api";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useOrderWebSocket } from "@shared/hooks/useOrderWebSocket";
import { useEtaText } from "@shared/hooks/useEtaText";
import { formatOptionsSummary, formatPrice } from "@shared/utils/price";
import type { OrdersStoreState } from "@shared/store/createOrdersStore";
import type { Order, OrderStatus } from "@shared/types/models";

interface OrderStatusScreenProps {
  orderId: string;
}

const STATUS_FLOW: OrderStatus[] = ["PENDING", "ACCEPTED", "READY", "COMPLETED"];

const formatTime = (value: string | null | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

function StatusSteps({ status }: { status: OrderStatus }): React.JSX.Element {
  const theme = useTheme();
  const currentIndex = status === "CANCELLED" ? -1 : STATUS_FLOW.indexOf(status);
  return (
    <View style={styles.steps} testID="status-steps">
      {STATUS_FLOW.map((step, i) => {
        const done = status !== "CANCELLED" && i <= currentIndex;
        const current = status !== "CANCELLED" && i === currentIndex;
        const dotColor = done ? theme.colors.success : theme.colors.border;
        const lineColor =
          status !== "CANCELLED" && i <= currentIndex
            ? theme.colors.success
            : theme.colors.border;
        return (
          <Fragment key={step}>
            {i > 0 ? (
              <View style={[styles.stepLine, { backgroundColor: lineColor }]} />
            ) : null}
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.stepDot,
                  { backgroundColor: current ? theme.colors.accent : dotColor },
                ]}
              />
              <AppText
                variant="caption"
                style={{
                  color: current
                    ? theme.colors.accent
                    : done
                      ? theme.colors.success
                      : theme.colors.text3,
                  fontWeight: current ? "800" : "500",
                }}
              >
                {t(`enums.orderStatus.${step}`)}
              </AppText>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

export function OrderStatusScreen({ orderId }: OrderStatusScreenProps): React.JSX.Element {
  const theme = useTheme();
  const lastHapticKey = useRef<string | null>(null);

  const { currentOrder } = useOrdersStore(
    useShallow((s: OrdersStoreState) => ({ currentOrder: s.currentOrder })),
  );

  const onStatusChange = useCallback(
    (next: OrderStatus) => {
      const key = `${orderId}:${next}`;
      if (lastHapticKey.current === key) return;
      lastHapticKey.current = key;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [orderId],
  );

  const { loadOrder } = useOrderWebSocket(orderId, createOrderWebSocket, { onStatusChange });

  const order: Order | null =
    currentOrder && currentOrder.id === orderId ? currentOrder : null;
  const eta = useEtaText(order?.estimated_ready_at, order?.status ?? "PENDING");

  if (!order) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Skeleton height={96} width={96} radius={48} />
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="80%" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <AppText variant="heading">
          {t("order.banner.orderNumber", { id: order.display_id })}
        </AppText>
      </View>

      <OrderStatusBadge status={order.status} cancellationReason={order.cancellation_reason ?? null} />

      {eta ? (
        <AppText variant="body" color="accent" style={styles.eta} testID="order-eta">
          {eta}
        </AppText>
      ) : null}

      {order.status !== "CANCELLED" ? <StatusSteps status={order.status} /> : null}

      <Card style={styles.detailsCard}>
        <AppText variant="heading" style={styles.sectionTitle}>
          {t("order.details.composition")}
        </AppText>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <AppText variant="body" color="muted" style={styles.qty}>
              ×{item.quantity}
            </AppText>
            <View style={styles.itemInfo}>
              <AppText variant="body">{item.menu_item_name}</AppText>
              {item.selected_options.length > 0 ? (
                <AppText variant="caption" color="muted">
                  {formatOptionsSummary(item.selected_options)}
                </AppText>
              ) : null}
            </View>
            <AppText variant="body" style={styles.itemPrice}>
              {formatPrice(item.price_at_purchase * item.quantity)}
            </AppText>
          </View>
        ))}

        <Divider spacing={12} />

        <View style={styles.totalRow}>
          <AppText variant="body" color="secondary">
            {t("order.details.total")}
          </AppText>
          <AppText variant="heading" style={{ color: theme.colors.accent }}>
            {formatPrice(order.total_price)}
          </AppText>
        </View>

        {order.restaurant_name ? (
          <View style={styles.metaRow}>
            <AppText variant="caption" color="muted">
              {t("order.details.venue")}
            </AppText>
            <AppText variant="caption" color="secondary">
              {order.restaurant_name}
            </AppText>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <AppText variant="caption" color="muted">
            {t("order.details.createdAt")}
          </AppText>
          <AppText variant="caption" color="secondary">
            {formatTime(order.created_at)}
          </AppText>
        </View>

        {order.comment ? (
          <View style={styles.metaRow}>
            <AppText variant="caption" color="muted">
              {t("order.details.comment")}
            </AppText>
            <AppText variant="caption" color="secondary" style={styles.comment}>
              {order.comment}
            </AppText>
          </View>
        ) : null}
      </Card>

      {order.status === "CANCELLED" && !order.items.length ? (
        <ErrorState message={t("order.status.loadFailed")} onRetry={() => { void loadOrder(); }} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    gap: 16,
    paddingTop: 40,
  },
  headerRow: {
    alignItems: "center",
    paddingBottom: 4,
  },
  eta: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 8,
  },
  steps: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: 5,
    borderRadius: 2,
  },
  stepCol: {
    alignItems: "center",
    gap: 6,
    maxWidth: 72,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailsCard: {
    marginTop: 8,
    gap: 8,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  qty: {
    minWidth: 28,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemPrice: {
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  comment: {
    flexShrink: 1,
    textAlign: "right",
  },
});
