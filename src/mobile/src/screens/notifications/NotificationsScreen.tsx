import { useCallback, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useShallow } from "zustand/react/shallow";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { Badge, Button, EmptyState, Skeleton } from "@/components/ui";
import { NotificationItem } from "@/components/domain/NotificationItem";
import { useTheme } from "@/theme/useTheme";
import { t } from "@/i18n";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { setBadgeCount } from "@/platform/pushNotifications";
import type { NotificationStoreState } from "@shared/store/createNotificationStore";
import type { Notification } from "@shared/types/models";

export function NotificationsScreen(): React.JSX.Element {
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const {
    notifications,
    unreadCount,
    total,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    connectWs,
    disconnectWs,
  } = useNotificationStore(
    useShallow((s: NotificationStoreState) => ({
      notifications: s.notifications,
      unreadCount: s.unreadCount,
      total: s.total,
      fetchNotifications: s.fetchNotifications,
      loadMore: s.loadMore,
      markAsRead: s.markAsRead,
      markAllAsRead: s.markAllAsRead,
      deleteNotification: s.deleteNotification,
      connectWs: s.connectWs,
      disconnectWs: s.disconnectWs,
    })),
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchNotifications(1).finally(() => { setLoading(false); });
    if (userId) connectWs(userId);
    return () => { disconnectWs(); };
  }, [userId, fetchNotifications, connectWs, disconnectWs]);

  useEffect(() => {
    void setBadgeCount(unreadCount);
  }, [unreadCount]);

  const onPressItem = useCallback(
    (item: Notification) => {
      if (!item.is_read) void markAsRead(item.id);
    },
    [markAsRead],
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <View style={styles.item}>
        <NotificationItem
          notification={item}
          onPress={() => { onPressItem(item); }}
          onDelete={() => { void deleteNotification(item.id); }}
        />
      </View>
    ),
    [onPressItem, deleteNotification],
  );

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <AppText variant="title">{t("profile.notifications.title")}</AppText>
        {unreadCount > 0 ? <Badge label={String(unreadCount)} tone="accent" /> : null}
      </View>
      {unreadCount > 0 ? (
        <Button
          title={t("profile.notifications.markAllRead")}
          variant="ghost"
          size="sm"
          fullWidth={false}
          onPress={() => { void markAllAsRead(); }}
          testID="notifications-mark-all"
        />
      ) : null}
    </View>
  );

  if (loading && notifications.length === 0) {
    return (
      <Screen padded={false}>
        <View style={styles.headerPad}>{header}</View>
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={72} radius={theme.radius.lg} />
          ))}
        </View>
      </Screen>
    );
  }

  if (notifications.length === 0) {
    return (
      <Screen padded={false}>
        <View style={styles.headerPad}>{header}</View>
        <EmptyState icon="notifications-off-outline" title={t("profile.notifications.empty")} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlashList
        testID="notifications-list"
        data={notifications}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        estimatedItemSize={88}
        ListHeaderComponent={<View style={styles.headerPad}>{header}</View>}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (notifications.length < total) void loadMore();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => { void fetchNotifications(1); }}
            tintColor={theme.colors.accent}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerPad: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    gap: 8,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
