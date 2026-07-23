import { useLocalSearchParams } from "expo-router";
import { RestaurantScreen } from "@/screens/restaurant/RestaurantScreen";

export default function RestaurantRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RestaurantScreen id={id} />;
}
