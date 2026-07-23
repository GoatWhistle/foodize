import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/ui";
import { AppText } from "@/components/AppText";
import { PrivacyScreen } from "@/components/PrivacyScreen";
import { useTheme } from "@/theme/useTheme";
import { useTranslation } from "@/i18n";
import { useSecurityStore } from "@/store/useSecurityStore";
import { requireBiometricUnlock } from "@/platform/biometricGate";
import { reportDeviceIntegrity } from "@/platform/deviceIntegrity";

interface SecurityProviderProps {
  children: React.ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const biometricEnabled = useSecurityStore((s) => s.biometricEnabled);
  const unlocked = useSecurityStore((s) => s.unlocked);
  const [compromised, setCompromised] = useState(false);

  const unlock = useCallback(() => {
    void requireBiometricUnlock(t("profile.settings.biometricPrompt"));
  }, [t]);

  useEffect(() => {
    if (biometricEnabled) unlock();
    void reportDeviceIntegrity().then((report) => {
      setCompromised(report.compromised);
    });
  }, [biometricEnabled, unlock]);

  const locked = biometricEnabled && !unlocked;

  if (locked) {
    return (
      <View style={[styles.lock, { backgroundColor: theme.colors.bg }]} testID="biometric-lock">
        <AppText variant="title">Foodize</AppText>
        <AppText variant="body" color="secondary" style={styles.lockText}>
          {t("profile.settings.biometricPrompt")}
        </AppText>
        <Button
          onPress={unlock}
          title={t("profile.settings.biometricEnable")}
          fullWidth={false}
          testID="biometric-unlock-retry"
        />
      </View>
    );
  }

  return (
    <PrivacyScreen>
      {compromised ? (
        <View
          style={[styles.banner, { backgroundColor: theme.colors.error }]}
          testID="integrity-banner"
        >
          <AppText variant="caption" color="onAccent" style={styles.bannerTitle}>
            {t("profile.settings.integrityWarning")}
          </AppText>
          <AppText variant="caption" color="onAccent">
            {t("profile.settings.integrityWarningDescription")}
          </AppText>
        </View>
      ) : null}
      {children}
    </PrivacyScreen>
  );
}

const styles = StyleSheet.create({
  lock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  lockText: {
    textAlign: "center",
  },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 2,
  },
  bannerTitle: {
    fontWeight: "700",
  },
});
