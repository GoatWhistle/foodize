import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";

export interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  size?: number;
}

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

export function Avatar({ name, uri, size = 44 }: AvatarProps): React.JSX.Element {
  const theme = useTheme();
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[dimension, { backgroundColor: theme.colors.bgSurface }]}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={[dimension, styles.fallback, { backgroundColor: theme.colors.accentSubtle }]}
    >
      <AppText variant="heading" style={{ color: theme.colors.accent }}>
        {name ? initialsOf(name) : "?"}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
