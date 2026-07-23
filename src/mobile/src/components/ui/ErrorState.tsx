import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";
import { useTheme } from "@/theme/useTheme";

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={56} color={theme.colors.error} />
      <AppText variant="body" color="secondary" style={styles.message}>
        {message ?? t("common.errors.somethingWentWrong")}
      </AppText>
      {onRetry ? (
        <Button
          title={t("common.actions.retry")}
          onPress={onRetry}
          fullWidth={false}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  message: {
    textAlign: "center",
  },
});
