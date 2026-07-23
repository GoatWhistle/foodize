import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useTheme } from "@/theme/useTheme";
import { t } from "@/i18n";

export function OfflineBanner(): React.JSX.Element | null {
  const { isOnline, justReconnected } = useNetworkStatus();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (isOnline && !justReconnected) return null;

  const online = isOnline && justReconnected;
  const background = online ? theme.colors.success : theme.colors.text2;
  const icon = online ? "checkmark-circle" : "cloud-offline";
  const label = online ? t("common.network.backOnline") : t("common.network.offline");

  return (
    <View
      testID="offline-banner"
      style={[styles.banner, { backgroundColor: background, paddingTop: insets.top + 6 }]}
    >
      <Ionicons name={icon} size={16} color={theme.colors.accentText} />
      <AppText variant="caption" style={[styles.text, { color: theme.colors.accentText }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 8,
  },
  text: {
    fontWeight: "600",
  },
});
