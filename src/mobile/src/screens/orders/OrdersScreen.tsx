import { useCallback } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { Chip, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { OrderCard } from "@/components/domain/OrderCard";
import { useTheme } from "@/theme/useTheme";
import { t } from "@/i18n";
import { useOrdersPageLogic } from "@shared/hooks/useOrdersPageLogic";
import type { Order } from "@shared/types/models";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: t("order.list.filterAll") },
  { value: "ACTIVE", label: t("order.list.filterActive") },
  { value: "DONE", label: t("order.list.filterDone") },
];

export function OrdersScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const {
    statusFilter,
    setStatusFilter,
    setPage,
    visibleOrders,
    ordersLoading,
    ordersError,
    hasMore,
    refresh,
  } = useOrdersPageLogic({ infiniteScroll: false });

  const openOrder = useCallback(
    (id: string) => {
      router.push({ pathname: "/order/[id]", params: { id } });
    },
    [router],
  );

  const onEndReached = useCallback(() => {
    if (hasMore && !ordersLoading) setPage((p) => p + 1);
  }, [hasMore, ordersLoading, setPage]);

  const renderItem = useCallback(
    ({ item }: { item: Order }) => (
      <View style={styles.item}>
        <OrderCard order={item} onPress={() => { openOrder(item.id); }} />
      </View>
    ),
    [openOrder],
  );

  const isInitialLoading = ordersLoading && visibleOrders.length === 0;

  const header = (
    <View style={styles.header}>
      <AppText variant="title" style={styles.title}>
        {t("order.list.title")}
      </AppText>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip
            key={f.value || "all"}
            label={f.label}
            selected={statusFilter === f.value}
            onPress={() => { setStatusFilter(f.value); }}
            testID={`orders-filter-${f.value || "all"}`}
          />
        ))}
      </View>
    </View>
  );

  if (ordersError && visibleOrders.length === 0) {
    return (
      <Screen padded={false}>
        {header}
        <ErrorState message={ordersError} onRetry={refresh} />
      </Screen>
    );
  }

  if (isInitialLoading) {
    return (
      <Screen padded={false}>
        {header}
        <View style={styles.skeletons}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={72} radius={theme.radius.lg} />
          ))}
        </View>
      </Screen>
    );
  }

  if (visibleOrders.length === 0) {
    const emptyTitle =
      statusFilter === "ACTIVE"
        ? t("order.list.emptyActiveTitle")
        : statusFilter === "DONE"
          ? t("order.list.emptyDoneTitle")
          : t("order.list.emptyTitle");
    const emptySubtitle =
      statusFilter === "ACTIVE"
        ? t("order.list.emptyActiveSubtitle")
        : statusFilter === "DONE"
          ? t("order.list.emptyDoneSubtitle")
          : t("order.list.emptySubtitle");
    return (
      <Screen padded={false}>
        {header}
        <EmptyState icon="receipt-outline" title={emptyTitle} description={emptySubtitle} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlashList
        testID="orders-list"
        data={visibleOrders}
        keyExtractor={(order) => order.id}
        renderItem={renderItem}
        estimatedItemSize={88}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={ordersLoading && visibleOrders.length > 0}
            onRefresh={refresh}
            tintColor={theme.colors.accent}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  title: {
    marginBottom: 4,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  item: {
    marginBottom: 12,
  },
  skeletons: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
