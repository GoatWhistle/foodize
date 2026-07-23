import { Stack, useLocalSearchParams } from "expo-router";
import { LegalScreen } from "@/screens/legal/LegalScreen";

export default function LegalRoute(): React.JSX.Element {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "" }} />
      <LegalScreen doc={doc ?? ""} />
    </>
  );
}
