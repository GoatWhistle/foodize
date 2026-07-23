import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Badge } from "@/components/ui";
import { t } from "@/i18n";
import { useTheme } from "@/theme/useTheme";
import type { Restaurant } from "@shared/types/models";

export interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  testID?: string;
}

function RestaurantCardBase({
  restaurant,
  onPress,
  isFavorite = false,
  onFavoriteToggle,
  testID,
}: RestaurantCardProps): React.JSX.Element {
  const theme = useTheme();
  const isOpen = restaurant.is_open;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t("catalog.restaurantCard.ariaLabel", { name: restaurant.name })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.bgCard,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.imageWrap}>
        {restaurant.photo_url ? (
          <Image
            source={{ uri: restaurant.photo_url }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.image, styles.placeholder, { backgroundColor: theme.colors.bgSurface }]}>
            <Ionicons name="restaurant" size={36} color={theme.colors.text3} />
          </View>
        )}
        {onFavoriteToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isFavorite }}
            accessibilityLabel={
              isFavorite
                ? t("catalog.restaurantCard.removeFromFavorites")
                : t("catalog.restaurantCard.addToFavorites")
            }
            testID={`${testID ?? "card"}-fav`}
            onPress={() => {
              onFavoriteToggle(restaurant.id);
            }}
            style={[styles.favButton, { backgroundColor: theme.colors.overlay }]}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={16}
              color={isFavorite ? theme.colors.error : theme.colors.accentText}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="heading" numberOfLines={1} style={styles.name}>
            {restaurant.name}
          </AppText>
          <Badge
            label={isOpen ? t("catalog.restaurantCard.open") : t("catalog.restaurantCard.closed")}
            tone={isOpen ? "success" : "neutral"}
          />
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={theme.colors.text3} />
          <AppText variant="caption" color="muted" numberOfLines={1} style={styles.address}>
            {restaurant.address}
          </AppText>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={14} color={theme.colors.warning} />
          <AppText variant="caption" color="secondary" style={styles.rating}>
            {restaurant.average_rating.toFixed(1)}
          </AppText>
          <AppText variant="caption" color="muted">
            {t("catalog.reviews.reviewsCount", { count: restaurant.review_count })}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

export const RestaurantCard = memo(RestaurantCardBase);

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 150,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  favButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 14,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  address: {
    flex: 1,
  },
  rating: {
    fontWeight: "600",
  },
});
