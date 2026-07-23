import { Stack } from "expo-router";
import { SettingsScreen } from "@/screens/settings/SettingsScreen";
import { t } from "@/i18n";

export default function SettingsRoute(): React.JSX.Element {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("profile.settings.title") }} />
      <SettingsScreen />
    </>
  );
}
