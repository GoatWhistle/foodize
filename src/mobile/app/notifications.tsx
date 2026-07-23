import { Stack } from "expo-router";
import { NotificationsScreen } from "@/screens/notifications/NotificationsScreen";
import { t } from "@/i18n";

export default function NotificationsRoute(): React.JSX.Element {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("profile.notifications.title") }} />
      <NotificationsScreen />
    </>
  );
}
