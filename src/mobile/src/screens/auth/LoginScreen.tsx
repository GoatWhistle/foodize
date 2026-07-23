import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/store/useAuthStore";
import { formatPhoneNumber, extractPhoneNumber } from "@shared/utils/phone";
import { translateApiError } from "@shared/utils/translateApiError";
import { t } from "@/i18n";
import { useTheme } from "@/theme/useTheme";

const isValidPhone = (raw: string): boolean => extractPhoneNumber(raw).length >= 12;

export function LoginScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    if (!phone.trim() || !password) {
      setError(t("auth.errors.enterPhoneAndPassword"));
      return;
    }
    if (!isValidPhone(phone)) {
      setError(t("auth.errors.invalidPhone"));
      return;
    }
    setSubmitting(true);
    try {
      await login({ phone_number: extractPhoneNumber(phone), password });
      router.replace("/(tabs)");
    } catch (err) {
      setError(translateApiError(err, t("auth.errors.wrongPhoneOrPassword")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <AppText variant="title" style={styles.title}>
          {t("auth.headings.password")}
        </AppText>
        <AppText variant="body" color="secondary" style={styles.subtitle}>
          {t("auth.subheadings.password")}
        </AppText>

        <View style={styles.form}>
          <Input
            label={t("auth.fields.phone")}
            value={phone}
            onChangeText={(value) => {
              setPhone(formatPhoneNumber(value));
            }}
            placeholder={t("auth.placeholders.phone")}
            keyboardType="phone-pad"
            autoComplete="tel"
            testID="login-phone"
          />
          <Input
            label={t("auth.fields.password")}
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.placeholders.passwordMin")}
            secureTextEntry
            autoComplete="password"
            testID="login-password"
          />

          {error ? (
            <AppText variant="caption" style={{ color: theme.colors.error }} testID="login-error">
              {error}
            </AppText>
          ) : null}

          <Button
            title={submitting ? t("auth.buttons.loggingIn") : t("auth.buttons.login")}
            loading={submitting}
            testID="login-submit"
            onPress={() => {
              void handleSubmit();
            }}
          />
        </View>

        <View style={styles.footer}>
          <AppText variant="caption" color="muted">
            {t("auth.footer.noAccount")}
          </AppText>
          <Link href="/(auth)/register" replace testID="go-register">
            <AppText variant="caption" color="accent" style={styles.link}>
              {t("auth.footer.registerLink")}
            </AppText>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
  },
  link: {
    fontWeight: "700",
  },
});
