import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useShallow } from "zustand/react/shallow";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { Skeleton, EmptyState } from "@/components/ui";
import { SearchBar } from "@/components/domain/SearchBar";
import { CategoryChips } from "@/components/domain/CategoryChips";
import type { CategoryChipItem } from "@/components/domain/CategoryChips";
import { RestaurantCard } from "@/components/domain/RestaurantCard";
import { useHomePageLogic } from "@shared/hooks/useHomePageLogic";
import { useCartStore } from "@/store/useCartStore";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import type { Restaurant } from "@shared/types/models";
import { t } from "@/i18n";
import { useTheme } from "@/theme/useTheme";

export function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const {
    search,
    setSearch,
    searching,
    onlyOpen,
    setOnlyOpen,
    sort,
    setSort,
    page,
    setPage,
    allRestaurants,
    hasMore,
    loading,
    resetFilters,
  } = useHomePageLogic({ infiniteScroll: false });

  const { favoriteIds, toggleFavorite } = useFavoriteStore(
    useShallow((s) => ({ favoriteIds: s.favoriteIds, toggleFavorite: s.toggle })),
  );
  const cartCount = useCartStore((s) => s.cartCount());

  const sortItems: CategoryChipItem[] = [
    { value: "onlyOpen", label: t("catalog.search.onlyOpen") },
    { value: "default", label: t("catalog.search.sortDefault") },
    { value: "rating", label: t("catalog.search.sortRating") },
    { value: "popularity", label: t("catalog.search.sortPopularity") },
  ];

  const onSelectChip = useCallback(
    (value: string): void => {
      if (value === "onlyOpen") {
        setOnlyOpen((prev) => !prev);
        return;
      }
      setSort(value);
    },
    [setOnlyOpen, setSort],
  );

  const onEndReached = useCallback((): void => {
    if (hasMore && !loading) {
      setPage((p) => p + 1);
    }
  }, [hasMore, loading, setPage]);

  const renderItem = useCallback(
    ({ item }: { item: Restaurant }): React.JSX.Element => (
      <RestaurantCard
        restaurant={item}
        testID={`restaurant-${item.id}`}
        isFavorite={favoriteIds.includes(item.id)}
        onFavoriteToggle={(id) => {
          void toggleFavorite(id);
        }}
        onPress={() => {
          router.push({ pathname: "/restaurant/[id]", params: { id: item.id } });
        }}
      />
    ),
    [favoriteIds, toggleFavorite, router],
  );

  const showSkeletons = loading && allRestaurants.length === 0;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <AppText variant="title">{t("catalog.home.allVenuesTitle")}</AppText>
        <SearchBar value={search} onChangeText={setSearch} loading={searching} testID="home-search" />
        <CategoryChips
          items={sortItems}
          selected={onlyOpen ? "onlyOpen" : sort}
          onSelect={onSelectChip}
          testID="home-chips"
        />
      </View>

      {showSkeletons ? (
        <View style={styles.skeletons} testID="home-skeletons">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={220} radius={theme.radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={allRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={220}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={Separator}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshing={loading && page === 1}
          onRefresh={() => {
            setPage(1);
          }}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={t("catalog.home.emptyTitle")}
              description={t("catalog.home.emptySubtitleMiniapp")}
              actionLabel={t("common.actions.reset")}
              onAction={resetFilters}
            />
          }
          testID="home-list"
        />
      )}

      {cartCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("order.cart.fabOpen")}
          testID="home-cart-fab"
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
    </Screen>
  );
}

function Separator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
    marginBottom: 8,
  },
  skeletons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
