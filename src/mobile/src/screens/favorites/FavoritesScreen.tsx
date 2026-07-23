import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useTheme } from "@/theme/useTheme";
import { t } from "@/i18n";
import { favoriteService } from "@shared/services/favoriteService";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import { logError } from "@shared/utils/logError";
import type { Favorite } from "@shared/types/models";

export function FavoritesScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const toggle = useFavoriteStore((s) => s.toggle);

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await favoriteService.getAll({ size: 100 });
      const list = Array.isArray(response.data.data) ? response.data.data : [];
      setFavorites(list);
    } catch (err) {
      logError("FavoritesScreen.load", err);
      setError(t("common.errors.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRemove = useCallback(
    async (restaurantId: string): Promise<void> => {
      setFavorites((prev) => prev.filter((f) => f.restaurant.id !== restaurantId));
      await toggle(restaurantId);
    },
    [toggle],
  );

  const openRestaurant = useCallback(
    (restaurantId: string) => {
      router.push({ pathname: "/restaurant/[id]", params: { id: restaurantId } });
    },
    [router],
  );

  const renderRightActions = useCallback(
    (restaurantId: string) => (
      <Pressable
        testID={`favorite-remove-${restaurantId}`}
        accessibilityRole="button"
        accessibilityLabel={t("profile.notifications.delete")}
        onPress={() => { void handleRemove(restaurantId); }}
        style={[styles.removeAction, { backgroundColor: theme.colors.error }]}
      >
        <Ionicons name="heart-dislike" size={22} color={theme.colors.accentText} />
      </Pressable>
    ),
    [handleRemove, theme.colors.error, theme.colors.accentText],
  );

  const renderItem = useCallback(
    ({ item }: { item: Favorite }) => (
      <View style={styles.item}>
        <ReanimatedSwipeable
          renderRightActions={() => renderRightActions(item.restaurant.id)}
          overshootRight={false}
        >
          <Card
            onPress={() => { openRestaurant(item.restaurant.id); }}
            testID={`favorite-${item.restaurant.id}`}
          >
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: theme.colors.accentSubtle }]}>
                <Ionicons name="storefront" size={20} color={theme.colors.accent} />
              </View>
              <View style={styles.body}>
                <AppText variant="body" style={styles.name} numberOfLines={1}>
                  {item.restaurant.name}
                </AppText>
                <AppText variant="caption" color="muted" numberOfLines={1}>
                  {item.restaurant.address}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.text3} />
            </View>
          </Card>
        </ReanimatedSwipeable>
      </View>
    ),
    [openRestaurant, renderRightActions, theme.colors],
  );

  const header = (
    <AppText variant="title" style={styles.title}>
      {t("profile.page.favorites")}
    </AppText>
  );

  if (error && favorites.length === 0) {
    return (
      <Screen padded={false}>
        <View style={styles.headerPad}>{header}</View>
        <ErrorState message={error} onRetry={() => { void load(); }} />
      </Screen>
    );
  }

  if (loading && favorites.length === 0) {
    return (
      <Screen padded={false}>
        <View style={styles.headerPad}>{header}</View>
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={68} radius={theme.radius.lg} />
          ))}
        </View>
      </Screen>
    );
  }

  if (favorites.length === 0) {
    return (
      <Screen padded={false}>
        <View style={styles.headerPad}>{header}</View>
        <EmptyState
          icon="heart-outline"
          title={t("profile.notifications.empty")}
          description={t("order.list.emptySubtitle")}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlashList
        testID="favorites-list"
        data={favorites}
        keyExtractor={(f) => f.restaurant.id}
        renderItem={renderItem}
        estimatedItemSize={84}
        ListHeaderComponent={<View style={styles.headerPad}>{header}</View>}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && favorites.length > 0}
            onRefresh={() => { void load(); }}
            tintColor={theme.colors.accent}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerPad: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  item: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: "700",
  },
  removeAction: {
    width: 72,
    marginBottom: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  skeletons: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
