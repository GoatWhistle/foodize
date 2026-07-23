import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";

export interface IconButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  size?: number;
  variant?: "surface" | "plain";
  accessibilityLabel: string;
  testID?: string;
}

export function IconButton({
  onPress,
  children,
  size = 40,
  variant = "surface",
  accessibilityLabel,
  testID,
}: IconButtonProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: variant === "surface" ? theme.colors.bgSurface : "transparent",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
});
