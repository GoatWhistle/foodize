import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { formatPrice } from "@shared/utils/price";
import { categoryLabel } from "@shared/utils/locales";
import { t } from "@/i18n";
import { useTheme } from "@/theme/useTheme";
import type { MenuItem } from "@shared/types/models";

export interface MenuItemCardProps {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
  isRestaurantOpen?: boolean;
  testID?: string;
}

function MenuItemCardBase({
  item,
  onSelect,
  isRestaurantOpen = true,
  testID,
}: MenuItemCardProps): React.JSX.Element {
  const theme = useTheme();
  const unavailable = !item.is_available || !isRestaurantOpen;

  const handlePress = (): void => {
    if (unavailable) return;
    onSelect?.(item);
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable }}
      accessibilityLabel={t("catalog.menuItem.openAria", { name: item.name })}
      onPress={handlePress}
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.bgCard,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          opacity: unavailable ? 0.5 : 1,
        },
      ]}
    >
      <View style={styles.imageWrap}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, styles.placeholder, { backgroundColor: theme.colors.bgSurface }]}>
            <Ionicons name="fast-food-outline" size={26} color={theme.colors.text3} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <AppText variant="body" numberOfLines={1} style={styles.name}>
          {item.name}
        </AppText>
        <AppText variant="caption" color="muted">
          {categoryLabel(item.category)}
        </AppText>
        <View style={styles.footer}>
          <AppText variant="body" color="accent" style={styles.price}>
            {formatPrice(item.price)}
          </AppText>
          {!unavailable ? (
            <View style={[styles.add, { backgroundColor: theme.colors.accentSubtle }]}>
              <Ionicons name="add" size={18} color={theme.colors.accent} />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const MenuItemCard = memo(MenuItemCardBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    padding: 10,
    gap: 12,
  },
  imageWrap: {
    width: 72,
    height: 72,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 3,
  },
  name: {
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  price: {
    fontWeight: "700",
  },
  add: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
