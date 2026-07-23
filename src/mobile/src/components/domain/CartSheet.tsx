import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/AppText";
import { IconButton } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice, formatOptionsSummary } from "@shared/utils/price";
import { getLinePrice, getOptionIds } from "@shared/utils/cartLine";
import type { CartLine } from "@shared/utils/cartLine";
import { t } from "@/i18n";
import { useTheme } from "@/theme/useTheme";

export interface CartSheetProps {
  cart: CartLine[];
  onIncrease: (line: CartLine) => void;
  onDecrease: (line: CartLine) => void;
  testID?: string;
}

export function CartSheet({
  cart,
  onIncrease,
  onDecrease,
  testID,
}: CartSheetProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.list}>
      {cart.map((line) => {
        const key = `${line.menuItem.id}:${getOptionIds(line).join(",")}`;
        const optionsSummary = formatOptionsSummary(line.selectedOptions);
        return (
          <View
            key={key}
            testID={`cart-line-${line.menuItem.id}`}
            style={[styles.row, { borderColor: theme.colors.border }]}
          >
            {line.menuItem.image_url ? (
              <Image
                source={{ uri: line.menuItem.image_url }}
                style={styles.image}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={[styles.image, styles.placeholder, { backgroundColor: theme.colors.bgSurface }]}>
                <Ionicons name="fast-food-outline" size={22} color={theme.colors.text3} />
              </View>
            )}

            <View style={styles.info}>
              <AppText variant="body" numberOfLines={1} style={styles.name}>
                {line.menuItem.name}
              </AppText>
              {optionsSummary ? (
                <AppText variant="caption" color="muted" numberOfLines={1}>
                  {optionsSummary}
                </AppText>
              ) : null}
              <AppText variant="caption" color="accent" style={styles.price}>
                {formatPrice(getLinePrice(line) * line.quantity)}
              </AppText>
            </View>

            <View style={styles.controls}>
              <IconButton
                size={30}
                accessibilityLabel={t("order.cart.decrease")}
                testID={`cart-dec-${line.menuItem.id}`}
                onPress={() => {
                  onDecrease(line);
                }}
              >
                <Ionicons name="remove" size={16} color={theme.colors.text1} />
              </IconButton>
              <AppText variant="body" style={styles.qty}>
                {line.quantity}
              </AppText>
              <IconButton
                size={30}
                accessibilityLabel={t("order.cart.increase")}
                testID={`cart-inc-${line.menuItem.id}`}
                onPress={() => {
                  onIncrease(line);
                }}
              >
                <Ionicons name="add" size={16} color={theme.colors.text1} />
              </IconButton>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: "600",
  },
  price: {
    fontWeight: "700",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qty: {
    minWidth: 20,
    textAlign: "center",
    fontWeight: "600",
  },
});
