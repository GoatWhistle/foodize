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

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return t("auth.errors.passwordTooShort");
  if (!/[a-zA-Z]/.test(password)) return t("auth.errors.passwordNeedsLetter");
  if (!/[0-9\W]/.test(password)) return t("auth.errors.passwordNeedsDigit");
  return null;
};

export function RegisterScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    if (!name.trim()) {
      setError(t("auth.errors.enterName"));
      return;
    }
    if (!isValidPhone(phone)) {
      setError(t("auth.errors.invalidPhone"));
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setSubmitting(true);
    const phoneNumber = extractPhoneNumber(phone);
    try {
      await register({ name: name.trim(), phone_number: phoneNumber, password });
      await login({ phone_number: phoneNumber, password });
      router.replace("/(tabs)");
    } catch (err) {
      setError(translateApiError(err, t("auth.errors.registrationFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <AppText variant="title" style={styles.title}>
          {t("auth.headings.register")}
        </AppText>
        <AppText variant="body" color="secondary" style={styles.subtitle}>
          {t("auth.subheadings.register")}
        </AppText>

        <View style={styles.form}>
          <Input
            label={t("auth.fields.yourName")}
            value={name}
            onChangeText={setName}
            placeholder={t("auth.placeholders.yourName")}
            autoComplete="name"
            testID="register-name"
          />
          <Input
            label={t("auth.fields.phone")}
            value={phone}
            onChangeText={(value) => {
              setPhone(formatPhoneNumber(value));
            }}
            placeholder={t("auth.placeholders.phone")}
            keyboardType="phone-pad"
            autoComplete="tel"
            testID="register-phone"
          />
          <Input
            label={t("auth.fields.password")}
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.placeholders.passwordHint")}
            secureTextEntry
            autoComplete="password-new"
            testID="register-password"
          />

          {error ? (
            <AppText variant="caption" style={{ color: theme.colors.error }} testID="register-error">
              {error}
            </AppText>
          ) : null}

          <Button
            title={submitting ? t("auth.buttons.creatingAccount") : t("auth.buttons.createAccount")}
            loading={submitting}
            testID="register-submit"
            onPress={() => {
              void handleSubmit();
            }}
          />
        </View>

        <View style={styles.footer}>
          <AppText variant="caption" color="muted">
            {t("auth.footer.haveAccount")}
          </AppText>
          <Link href="/(auth)/login" replace testID="go-login">
            <AppText variant="caption" color="accent" style={styles.link}>
              {t("auth.footer.loginLink")}
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
