import { Stack, useLocalSearchParams } from "expo-router";
import { OrderStatusScreen } from "@/screens/orderStatus/OrderStatusScreen";
import { t } from "@/i18n";

export default function OrderRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("order.status.headerLabel") }} />
      <OrderStatusScreen orderId={id ?? ""} />
    </>
  );
}
