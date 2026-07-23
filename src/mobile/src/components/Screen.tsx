import { ScrollView, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/theme/theme";

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
  },
  padded: {
    padding: theme.spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export function Screen({
  children,
  scroll = false,
  padded = true,
  contentStyle,
}: ScreenProps): React.JSX.Element {
  const innerStyle: StyleProp<ViewStyle> = [padded ? styles.padded : null, contentStyle];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, innerStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, innerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
