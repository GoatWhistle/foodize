import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useShallow } from "zustand/react/shallow";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { Badge, IconButton, Rating, Skeleton, ErrorState } from "@/components/ui";
import { CategoryChips } from "@/components/domain/CategoryChips";
import type { CategoryChipItem } from "@/components/domain/CategoryChips";
import { MenuItemCard } from "@/components/domain/MenuItemCard";
import { ProductSheet } from "@/components/domain/ProductSheet";
import type { ProductSheetOption } from "@/components/domain/ProductSheet";
import { useRestaurantPageController } from "@shared/hooks/useRestaurantPageController";
import { useCartStore } from "@/store/useCartStore";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import { useAuthStore } from "@/store/useAuthStore";
import { categoryLabel } from "@shared/utils/locales";
import type { MenuItem } from "@shared/types/models";
import { t } from "@/i18n";
import { useTheme } from "@/theme/useTheme";

export interface RestaurantScreenProps {
  id: string;
}

export function RestaurantScreen({ id }: RestaurantScreenProps): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addToCart);
  const cartCount = useCartStore((s) => s.cartCount());
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { favoriteIds, toggleFavorite } = useFavoriteStore(
    useShallow((s) => ({ favoriteIds: s.favoriteIds, toggleFavorite: s.toggle })),
  );

  const controller = useRestaurantPageController<ProductSheetOption>({
    id,
    initialRestaurant: null,
    currentUserId: userId,
    addToCart: (item, restaurantId, options, quantity) =>
      addToCart(
        item,
        restaurantId,
        options.map((o) => ({ id: o.id, option_id: o.id, name: o.name, price_delta: o.price_delta })),
        quantity,
      ),
    toggleFavorite: (restaurantId) => toggleFavorite(restaurantId),
    favoriteIds,
    requestConfirm: () => {
      /* reviews confirm not used on this screen */
    },
  });

  const {
    restaurantView,
    restaurantLoading,
    restaurantError,
    loading,
    isRestaurantOpen,
    isFav,
    categories,
    activeCategory,
    setActiveCategory,
    filteredMenuItems,
    selectedProduct,
    setSelectedProduct,
    handleProductAdd,
    handleToggleFavorite,
  } = controller;

  const chipItems: CategoryChipItem[] = categories.map((c) => ({
    value: c,
    label: c === "ALL" ? t("catalog.restaurantPage.allCategories") : categoryLabel(c),
  }));

  const renderItem = useCallback(
    ({ item }: { item: MenuItem }): React.JSX.Element => (
      <MenuItemCard
        item={item}
        testID={`menu-item-${item.id}`}
        isRestaurantOpen={isRestaurantOpen}
        onSelect={setSelectedProduct}
      />
    ),
    [isRestaurantOpen, setSelectedProduct],
  );

  if (restaurantError) {
    return (
      <Screen>
        <ErrorState message={restaurantError} />
      </Screen>
    );
  }

  const photoUrl = "photo_url" in restaurantView ? restaurantView.photo_url : null;
  const rating = "average_rating" in restaurantView ? restaurantView.average_rating : null;

  return (
    <Screen padded={false}>
      <View style={styles.headerBar}>
        <IconButton
          accessibilityLabel={t("common.actions.back")}
          testID="restaurant-back"
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text1} />
        </IconButton>
        <IconButton
          accessibilityLabel={
            isFav
              ? t("catalog.restaurantCard.removeFromFavorites")
              : t("catalog.restaurantCard.addToFavorites")
          }
          testID="restaurant-fav"
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={20}
            color={isFav ? theme.colors.error : theme.colors.text1}
          />
        </IconButton>
      </View>

      <FlashList
        data={filteredMenuItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={92}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.hero}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.heroImage} contentFit="cover" transition={150} />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder, { backgroundColor: theme.colors.bgSurface }]}>
                <Ionicons name="restaurant" size={44} color={theme.colors.text3} />
              </View>
            )}
            <View style={styles.heroBody}>
              <View style={styles.titleRow}>
                <AppText variant="title" numberOfLines={2} style={styles.name}>
                  {restaurantView.name}
                </AppText>
                <Badge
                  label={
                    isRestaurantOpen
                      ? t("catalog.restaurantCard.open")
                      : t("catalog.restaurantCard.closed")
                  }
                  tone={isRestaurantOpen ? "success" : "neutral"}
                />
              </View>
              {restaurantView.address ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={theme.colors.text3} />
                  <AppText variant="caption" color="muted">
                    {restaurantView.address}
                  </AppText>
                </View>
              ) : null}
              {rating != null ? <Rating value={rating} /> : null}

              {restaurantLoading ? (
                <Skeleton height={20} width="60%" />
              ) : (
                <CategoryChips
                  items={chipItems}
                  selected={activeCategory}
                  onSelect={setActiveCategory}
                  testID="restaurant-categories"
                />
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.menuSkeletons}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={72} radius={theme.radius.md} />
              ))}
            </View>
          ) : (
            <AppText variant="body" color="muted" style={styles.emptyMenu}>
              {t("common.states.empty")}
            </AppText>
          )
        }
        testID="restaurant-menu"
      />

      {cartCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("order.cart.fabOpen")}
          testID="restaurant-cart-fab"
          onPress={() => {
            router.push("/cart");
          }}
          style={[styles.fab, { backgroundColor: theme.colors.accent }]}
        >
          <Ionicons name="cart" size={22} color={theme.colors.accentText} />
          <AppText variant="body" color="onAccent" style={styles.fabCount}>
            {cartCount}
          </AppText>
        </Pressable>
      ) : null}

      <ProductSheet
        item={selectedProduct}
        isRestaurantOpen={isRestaurantOpen}
        onClose={() => {
          setSelectedProduct(null);
        }}
        onAdd={handleProductAdd}
      />
    </Screen>
  );
}

function Separator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  hero: {
    marginBottom: 12,
  },
  heroImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
  },
  heroPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroBody: {
    gap: 8,
    marginTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  menuSkeletons: {
    gap: 12,
  },
  emptyMenu: {
    textAlign: "center",
    paddingVertical: 24,
  },
  separator: {
    height: 12,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    height: 52,
    borderRadius: 26,
  },
  fabCount: {
    fontWeight: "700",
  },
});
