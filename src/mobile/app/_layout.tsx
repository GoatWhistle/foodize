import { rehydrateLanguage } from "@/platform/languagePersistence";
import { useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { useLanguageStore } from "@shared/store/useLanguageStore";
import { isLanguage } from "@shared/i18n/types";
import { tokenStorage } from "@/platform/tokenStorage";
import { setOnUnauthorized } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useTheme } from "@/theme/useTheme";
import { initObservability } from "@/services/observability";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SecurityProvider } from "@/components/SecurityProvider";
import { OfflineBanner } from "@/components/OfflineBanner";
import { loadQueue, startQueueAutoFlush } from "@/services/offlineQueue";

void SplashScreen.preventAutoHideAsync();
initObservability();

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default function RootLayout(): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setOnUnauthorized(() => {
      void useAuthStore.getState().logout();
    });

    const bootstrap = async (): Promise<void> => {
      const storedLanguage = await rehydrateLanguage();
      if (isLanguage(storedLanguage)) {
        useLanguageStore.getState().setLanguage(storedLanguage);
      }
      await tokenStorage.loadAccessToken();
      await useAuthStore.getState().fetchMe();
      await loadQueue();
      setReady(true);
    };

    void bootstrap();
    const unsubscribe = startQueueAutoFlush();
    return unsubscribe;
  }, []);

  const onLayout = useCallback(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return <View style={[styles.root, { backgroundColor: theme.colors.bg }]} />;

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayout}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <SecurityProvider>
            <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.bg },
              }}
            />
            <OfflineBanner />
          </SecurityProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
