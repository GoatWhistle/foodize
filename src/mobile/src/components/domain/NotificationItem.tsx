import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, IconButton } from "@/components/ui";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";
import { useTranslation } from "@/i18n";
import { notificationTitle, notificationMessage } from "@shared/utils/notificationText";
import type { Notification } from "@shared/types/models";

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
  onDelete?: () => void;
}

const formatTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday
    ? date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

export function NotificationItem({
  notification,
  onPress,
  onDelete,
}: NotificationItemProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const iconName = notification.type === "ORDER_STATUS" ? "receipt" : "megaphone";

  return (
    <Card {...(onPress ? { onPress } : {})} testID={`notification-${notification.id}`}>
      <View style={styles.row}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: notification.is_read
                ? theme.colors.bgSurface
                : theme.colors.accentSubtle,
            },
          ]}
        >
          <Ionicons
            name={iconName}
            size={18}
            color={notification.is_read ? theme.colors.text3 : theme.colors.accent}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            {!notification.is_read ? (
              <View
                style={[styles.dot, { backgroundColor: theme.colors.accent }]}
                testID="notification-unread-dot"
              />
            ) : null}
            <AppText variant="body" style={styles.title} numberOfLines={1}>
              {notificationTitle(notification)}
            </AppText>
          </View>
          <AppText variant="caption" color="secondary" numberOfLines={2}>
            {notificationMessage(notification)}
          </AppText>
          <AppText variant="caption" color="muted">
            {formatTime(notification.created_at)}
          </AppText>
        </View>

        {onDelete ? (
          <IconButton
            onPress={onDelete}
            variant="plain"
            size={32}
            accessibilityLabel={t("profile.notifications.delete")}
            testID={`notification-delete-${notification.id}`}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.text3} />
          </IconButton>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontWeight: "700",
    flexShrink: 1,
  },
});
