import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { Button, Sheet } from "@/components/ui";
import { formatPrice } from "@shared/utils/price";
import { t } from "@/i18n";
import { useTheme } from "@/theme/useTheme";
import type { MenuItem, MenuItemOption, MenuItemOptionGroup } from "@shared/types/models";

export interface ProductSheetOption {
  id: string;
  name: string;
  price_delta: number;
}

export interface ProductSheetAddPayload {
  item: MenuItem;
  selectedOptions: ProductSheetOption[];
  quantity: number;
}

export interface ProductSheetProps {
  item: MenuItem | null;
  onClose: () => void;
  onAdd: (payload: ProductSheetAddPayload) => void;
  isRestaurantOpen?: boolean;
}

const getActiveGroups = (item: MenuItem | null): MenuItemOptionGroup[] =>
  (item?.option_groups ?? [])
    .filter((group) => group.is_active)
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => option.is_available),
    }))
    .filter((group) => group.options.length > 0);

const getMinSelected = (group: MenuItemOptionGroup): number =>
  group.is_required ? Math.max(1, group.min_selected || 0) : group.min_selected || 0;

const groupHint = (group: MenuItemOptionGroup): string => {
  const max = group.selection_type === "single" ? 1 : group.max_selected;
  const min = getMinSelected(group);
  if (group.selection_type === "single") {
    return group.is_required
      ? t("catalog.product.hintSingleRequired")
      : t("catalog.product.hintSingleOptional");
  }
  if (group.is_required && max) {
    return min === max
      ? t("catalog.product.hintExact", { count: min })
      : t("catalog.product.hintRange", { min, max });
  }
  if (group.is_required) return t("catalog.product.hintMin", { min });
  if (max) return t("catalog.product.hintMax", { max });
  return t("catalog.product.hintMultiple");
};

const initialSelection = (groups: MenuItemOptionGroup[]): string[] =>
  groups.flatMap((group) => {
    const first = group.options[0];
    return group.is_required && group.selection_type === "single" && first ? [first.id] : [];
  });

export function ProductSheet({
  item,
  onClose,
  onAdd,
  isRestaurantOpen = true,
}: ProductSheetProps): React.JSX.Element {
  const theme = useTheme();
  const groups = useMemo(() => getActiveGroups(item), [item]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) return;
    setSelectedIds(initialSelection(groups));
    setQuantity(1);
    setError("");
  }, [item, groups]);

  const allOptions = useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const selectedOptions = allOptions.filter((option) => selectedIds.includes(option.id));
  const optionsDelta = selectedOptions.reduce((sum, option) => sum + (option.price_delta || 0), 0);
  const unitPrice = (item?.price ?? 0) + optionsDelta;
  const total = unitPrice * quantity;

  const toggleOption = (group: MenuItemOptionGroup, option: MenuItemOption): void => {
    setError("");
    setSelectedIds((prev) => {
      const groupIds = group.options.map((o) => o.id);
      if (group.selection_type === "single") {
        return [...prev.filter((id) => !groupIds.includes(id)), option.id];
      }
      if (prev.includes(option.id)) {
        return prev.filter((id) => id !== option.id);
      }
      const selectedInGroup = prev.filter((id) => groupIds.includes(id)).length;
      if (group.max_selected && selectedInGroup >= group.max_selected) {
        return prev;
      }
      return [...prev, option.id];
    });
  };

  const handleAdd = (): void => {
    if (!item) return;
    for (const group of groups) {
      const min = getMinSelected(group);
      const count = selectedIds.filter((id) => group.options.some((o) => o.id === id)).length;
      if (count < min) {
        setError(t("catalog.product.selectGroup", { group: group.name }));
        return;
      }
    }
    onAdd({
      item,
      selectedOptions: selectedOptions.map((option) => ({
        id: option.id,
        name: option.name,
        price_delta: option.price_delta,
      })),
      quantity,
    });
  };

  return (
    <Sheet visible={item !== null} onClose={onClose} {...(item ? { title: item.name } : {})}>
      {item ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.photo} contentFit="cover" transition={150} />
          ) : null}

          {item.description ? (
            <AppText variant="body" color="secondary" style={styles.description}>
              {item.description}
            </AppText>
          ) : null}

          <View style={styles.prepRow}>
            <Ionicons name="time-outline" size={15} color={theme.colors.text3} />
            <AppText variant="caption" color="muted">
              {t("catalog.product.prepTime", { minutes: item.prep_time_minutes })}
            </AppText>
          </View>

          {groups.map((group) => (
            <View key={group.id} style={styles.group}>
              <View style={styles.groupHead}>
                <AppText variant="body" style={styles.groupName}>
                  {group.name}
                </AppText>
                <AppText variant="caption" color="muted">
                  {groupHint(group)}
                </AppText>
              </View>
              {group.options.map((option) => {
                const checked = selectedIds.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    testID={`option-${option.id}`}
                    onPress={() => {
                      toggleOption(group, option);
                    }}
                    style={[
                      styles.option,
                      {
                        borderColor: checked ? theme.colors.accent : theme.colors.border,
                        backgroundColor: checked ? theme.colors.accentSubtle : theme.colors.bgCard,
                        borderRadius: theme.radius.sm,
                      },
                    ]}
                  >
                    <Ionicons
                      name={checked ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={checked ? theme.colors.accent : theme.colors.text3}
                    />
                    <AppText variant="body" style={styles.optionName}>
                      {option.name}
                    </AppText>
                    {option.price_delta > 0 ? (
                      <AppText variant="caption" color="secondary">
                        {`+${formatPrice(option.price_delta)}`}
                      </AppText>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}

          {error ? (
            <AppText variant="caption" style={{ color: theme.colors.error }}>
              {error}
            </AppText>
          ) : null}

          <View style={styles.quantityRow}>
            <Button
              title="−"
              variant="secondary"
              size="sm"
              fullWidth={false}
              testID="qty-decrease"
              onPress={() => {
                setQuantity((q) => Math.max(1, q - 1));
              }}
            />
            <AppText variant="heading" style={styles.quantityValue}>
              {quantity}
            </AppText>
            <Button
              title="+"
              variant="secondary"
              size="sm"
              fullWidth={false}
              testID="qty-increase"
              onPress={() => {
                setQuantity((q) => q + 1);
              }}
            />
          </View>

          <Button
            title={
              isRestaurantOpen
                ? t("catalog.product.add", { total: formatPrice(total) })
                : t("catalog.product.venueClosed")
            }
            disabled={!isRestaurantOpen}
            testID="product-add"
            onPress={handleAdd}
            style={styles.addButton}
          />
        </ScrollView>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  description: {
    marginBottom: 10,
  },
  prepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  group: {
    marginBottom: 16,
    gap: 8,
  },
  groupHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupName: {
    fontWeight: "600",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionName: {
    flex: 1,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginVertical: 12,
  },
  quantityValue: {
    minWidth: 32,
    textAlign: "center",
  },
  addButton: {
    marginTop: 4,
  },
});
