import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "error";

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = "neutral" }: BadgeProps): React.JSX.Element {
  const theme = useTheme();

  const backgrounds: Record<BadgeTone, string> = {
    neutral: theme.colors.bgSurface,
    accent: theme.colors.accentSubtle,
    success: "rgba(47, 158, 95, 0.16)",
    warning: "rgba(217, 163, 52, 0.18)",
    error: "rgba(217, 75, 52, 0.16)",
  };
  const foregrounds: Record<BadgeTone, string> = {
    neutral: theme.colors.text2,
    accent: theme.colors.accent,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: backgrounds[tone], borderRadius: theme.radius.pill },
      ]}
    >
      <AppText variant="caption" style={{ color: foregrounds[tone], fontWeight: "600" }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
});
