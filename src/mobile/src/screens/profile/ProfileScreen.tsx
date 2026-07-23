import { useCallback } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { Avatar, Button, Card, Divider } from "@/components/ui";
import { useTheme } from "@/theme/useTheme";
import { t } from "@/i18n";
import { useProfilePage } from "@shared/hooks/useProfilePage";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface ProfileLink {
  key: string;
  icon: IoniconName;
  label: string;
  route: Href;
  testID: string;
}

const LINKS: ProfileLink[] = [
  {
    key: "orders",
    icon: "receipt-outline",
    label: t("profile.page.myOrders"),
    route: "/(tabs)/orders",
    testID: "profile-link-orders",
  },
  {
    key: "favorites",
    icon: "heart-outline",
    label: t("profile.page.favorites"),
    route: "/(tabs)/favorites",
    testID: "profile-link-favorites",
  },
  {
    key: "notifications",
    icon: "notifications-outline",
    label: t("profile.page.notifications"),
    route: "/notifications",
    testID: "profile-link-notifications",
  },
  {
    key: "settings",
    icon: "settings-outline",
    label: t("profile.page.settings"),
    route: "/settings",
    testID: "profile-link-settings",
  },
];

export function ProfileScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout, displayName } = useProfilePage();

  const confirmLogout = useCallback(() => {
    Alert.alert(
      t("profile.page.logoutTitle"),
      t("profile.page.logoutMessage"),
      [
        { text: t("profile.page.logoutCancel"), style: "cancel" },
        {
          text: t("profile.page.logoutConfirm"),
          style: "destructive",
          onPress: () => { void logout(); },
        },
      ],
    );
  }, [logout]);

  return (
    <Screen scroll>
      <AppText variant="title" style={styles.title}>
        {t("profile.nav.profile")}
      </AppText>

      <Card style={styles.userCard}>
        <View style={styles.userRow}>
          <Avatar name={displayName} size={56} />
          <View style={styles.userInfo}>
            <AppText variant="heading" numberOfLines={1}>
              {displayName}
            </AppText>
            {user?.phone_number ? (
              <AppText variant="caption" color="muted">
                {user.phone_number}
              </AppText>
            ) : null}
          </View>
        </View>
      </Card>

      <Card padded={false} style={styles.linksCard}>
        {LINKS.map((link, index) => (
          <View key={link.key}>
            {index > 0 ? <Divider /> : null}
            <Pressable
              testID={link.testID}
              accessibilityRole="button"
              onPress={() => { router.push(link.route); }}
              style={({ pressed }) => [styles.link, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name={link.icon} size={20} color={theme.colors.text2} />
              <AppText variant="body" style={styles.linkLabel}>
                {link.label}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.text3} />
            </Pressable>
          </View>
        ))}
      </Card>

      <Card padded={false} style={styles.linksCard}>
        <Pressable
          testID="profile-link-terms"
          accessibilityRole="button"
          onPress={() => { router.push({ pathname: "/legal/[doc]", params: { doc: "terms" } }); }}
          style={({ pressed }) => [styles.link, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="document-text-outline" size={20} color={theme.colors.text2} />
          <AppText variant="body" style={styles.linkLabel}>
            {t("profile.settings.terms")}
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text3} />
        </Pressable>
        <Divider />
        <Pressable
          testID="profile-link-privacy"
          accessibilityRole="button"
          onPress={() => { router.push({ pathname: "/legal/[doc]", params: { doc: "privacy" } }); }}
          style={({ pressed }) => [styles.link, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.text2} />
          <AppText variant="body" style={styles.linkLabel}>
            {t("profile.settings.privacy")}
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text3} />
        </Pressable>
      </Card>

      <Button
        title={t("profile.page.logout")}
        variant="danger"
        onPress={confirmLogout}
        testID="profile-logout"
        style={styles.logout}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  userCard: {
    marginBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  linksCard: {
    marginBottom: 16,
    overflow: "hidden",
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  linkLabel: {
    flex: 1,
  },
  logout: {
    marginTop: 8,
  },
});
