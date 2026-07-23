import { StyleSheet, Text } from "react-native";
import type { StyleProp, TextProps, TextStyle } from "react-native";
import { theme } from "@/theme/theme";
import type { TypographyVariant } from "@/theme/theme";

type AppTextColor = "primary" | "secondary" | "muted" | "accent" | "onAccent";

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: AppTextColor;
  style?: StyleProp<TextStyle>;
}

const colorMap: Record<AppTextColor, string> = {
  primary: theme.colors.text1,
  secondary: theme.colors.text2,
  muted: theme.colors.text3,
  accent: theme.colors.accent,
  onAccent: theme.colors.accentText,
};

const variantStyles = StyleSheet.create({
  title: theme.typography.title,
  heading: theme.typography.heading,
  body: theme.typography.body,
  caption: theme.typography.caption,
});

export function AppText({
  variant = "body",
  color = "primary",
  style,
  ...rest
}: AppTextProps): React.JSX.Element {
  return <Text style={[variantStyles[variant], { color: colorMap[color] }, style]} {...rest} />;
}
