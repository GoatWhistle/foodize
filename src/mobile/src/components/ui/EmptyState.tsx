import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/useTheme";

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "sad-outline",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={theme.colors.text3} />
      <AppText variant="heading" style={styles.title}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="body" color="muted" style={styles.description}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} variant="secondary" />
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
  title: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
  },
});
