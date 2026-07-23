import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { Card } from "@/components/ui";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";
import { useTranslation } from "@/i18n";
import { useSecurityStore } from "@/store/useSecurityStore";
import {
  authenticateWithBiometrics,
  getBiometricAvailability,
} from "@/platform/biometrics";
import type { BiometricAvailability } from "@/platform/biometrics";

export function BiometricToggle(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const enabled = useSecurityStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useSecurityStore((s) => s.setBiometricEnabled);
  const [availability, setAvailability] = useState<BiometricAvailability>("available");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void getBiometricAvailability().then((result) => {
      if (active) setAvailability(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const hintKey = ((): string | null => {
    if (availability === "no_hardware" || availability === "error") {
      return "profile.settings.biometricUnavailable";
    }
    if (availability === "not_enrolled") {
      return "profile.settings.biometricNotEnrolled";
    }
    return null;
  })();

  const disabled = busy || availability !== "available";

  const onToggle = useCallback(
    async (next: boolean) => {
      if (!next) {
        setBiometricEnabled(false);
        return;
      }
      if (availability !== "available") return;
      setBusy(true);
      try {
        const result = await authenticateWithBiometrics(t("profile.settings.biometricPrompt"));
        setBiometricEnabled(result.success);
      } finally {
        setBusy(false);
      }
    },
    [availability, setBiometricEnabled, t],
  );

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.text}>
          <AppText variant="body">{t("profile.settings.biometric")}</AppText>
          <AppText variant="caption" color="muted">
            {hintKey ? t(hintKey) : t("profile.settings.biometricDescription")}
          </AppText>
        </View>
        <Switch
          value={enabled}
          disabled={disabled}
          onValueChange={(next) => {
            void onToggle(next);
          }}
          trackColor={{ true: theme.colors.accent, false: theme.colors.borderMid }}
          testID="biometric-toggle"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  text: {
    flex: 1,
    gap: 4,
  },
});
