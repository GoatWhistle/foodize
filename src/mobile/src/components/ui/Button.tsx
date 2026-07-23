import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const heightForSize: Record<ButtonSize, number> = { sm: 40, md: 48, lg: 56 };

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = true,
  leftIcon,
  style,
  testID,
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const background: Record<ButtonVariant, string> = {
    primary: theme.colors.accent,
    secondary: theme.colors.bgSurface,
    ghost: "transparent",
    danger: theme.colors.error,
  };
  const textColor: Record<ButtonVariant, "onAccent" | "primary" | "accent"> = {
    primary: "onAccent",
    secondary: "primary",
    ghost: "accent",
    danger: "onAccent",
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: heightForSize[size],
          backgroundColor: background[variant],
          borderRadius: theme.radius.pill,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          paddingHorizontal: theme.spacing.xl,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.accentText} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <AppText variant="heading" color={textColor[variant]}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    marginRight: 2,
  },
});
