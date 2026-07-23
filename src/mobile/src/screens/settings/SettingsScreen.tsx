import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { Card, Chip, Divider } from "@/components/ui";
import { useTheme } from "@/theme/useTheme";
import { t, useLanguageStore } from "@/i18n";
import { useThemeStore } from "@shared/store/useThemeStore";
import { SUPPORTED_LANGUAGES } from "@shared/i18n/types";
import type { ThemePreference } from "@shared/store/useThemeStore";
import type { Language } from "@shared/i18n/types";
import { registerDeviceToken } from "@/services/push";
import { BiometricToggle } from "@/components/domain/BiometricToggle";

const THEME_OPTIONS: ThemePreference[] = ["light", "system", "dark"];

const themeLabel = (value: ThemePreference): string =>
  value === "light"
    ? t("profile.theme.light")
    : value === "dark"
      ? t("profile.theme.dark")
      : t("profile.theme.system");

const languageLabel = (value: Language): string =>
  value === "ru" ? t("profile.language.ru") : t("profile.language.en");

export function SettingsScreen(): React.JSX.Element {
  const theme = useTheme();
  const preference = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const [pushState, setPushState] = useState<"idle" | "enabled" | "denied">("idle");
  const [pushLoading, setPushLoading] = useState(false);

  const enablePush = useCallback(async (): Promise<void> => {
    setPushLoading(true);
    try {
      const result = await registerDeviceToken(language);
      setPushState(result.token ? "enabled" : "denied");
    } finally {
      setPushLoading(false);
    }
  }, [language]);

  return (
    <Screen scroll>
      <AppText variant="title" style={styles.title}>
        {t("profile.settings.title")}
      </AppText>

      <Card style={styles.section}>
        <AppText variant="heading" style={styles.sectionTitle}>
          {t("profile.theme.label")}
        </AppText>
        <View style={styles.options}>
          {THEME_OPTIONS.map((value) => (
            <Chip
              key={value}
              label={themeLabel(value)}
              selected={preference === value}
              onPress={() => { setTheme(value); }}
              testID={`theme-${value}`}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.section}>
        <AppText variant="heading" style={styles.sectionTitle}>
          {t("profile.language.label")}
        </AppText>
        <View style={styles.options}>
          {SUPPORTED_LANGUAGES.map((value) => (
            <Chip
              key={value}
              label={languageLabel(value)}
              selected={language === value}
              onPress={() => { setLanguage(value); }}
              testID={`language-${value}`}
            />
          ))}
        </View>
      </Card>

      <BiometricToggle />

      <Card style={styles.section}>
        <View style={styles.pushHeader}>
          <Ionicons name="notifications" size={20} color={theme.colors.accent} />
          <View style={styles.pushText}>
            <AppText variant="body" style={styles.pushTitle}>
              {t("profile.settings.push")}
            </AppText>
            <AppText variant="caption" color="muted">
              {t("profile.settings.pushDescription")}
            </AppText>
          </View>
        </View>
        <Divider spacing={12} />
        {pushState === "enabled" ? (
          <AppText variant="caption" style={{ color: theme.colors.success }} testID="push-enabled">
            {t("profile.settings.pushEnabled")}
          </AppText>
        ) : pushState === "denied" ? (
          <AppText variant="caption" style={{ color: theme.colors.error }} testID="push-denied">
            {t("profile.settings.pushDenied")}
          </AppText>
        ) : (
          <Chip
            label={
              pushLoading ? t("common.states.loading") : t("profile.settings.pushEnable")
            }
            selected={false}
            onPress={() => {
              if (!pushLoading) void enablePush();
            }}
            testID="push-enable"
          />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pushHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pushText: {
    flex: 1,
    gap: 2,
  },
  pushTitle: {
    fontWeight: "600",
  },
});
