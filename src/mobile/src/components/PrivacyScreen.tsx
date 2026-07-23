import { useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
import type { AppStateStatus } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";

interface PrivacyScreenProps {
  children: React.ReactNode;
}

const isHidden = (state: AppStateStatus): boolean =>
  state === "background" || state === "inactive";

export function PrivacyScreen({ children }: PrivacyScreenProps): React.JSX.Element {
  const theme = useTheme();
  const [obscured, setObscured] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      setObscured(isHidden(next));
      appState.current = next;
    });
    setObscured(isHidden(AppState.currentState));
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.root}>
      {children}
      {obscured ? (
        <View
          style={[styles.overlay, { backgroundColor: theme.colors.accent }]}
          testID="privacy-overlay"
        >
          <AppText variant="title" color="onAccent" style={styles.logo}>
            Foodize
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontWeight: "800",
    letterSpacing: 1,
  },
});
