import { ScrollView, StyleSheet } from "react-native";
import { Chip } from "@/components/ui";

export interface CategoryChipItem {
  value: string;
  label: string;
}

export interface CategoryChipsProps {
  items: CategoryChipItem[];
  selected: string;
  onSelect: (value: string) => void;
  testID?: string;
}

export function CategoryChips({
  items,
  selected,
  onSelect,
  testID,
}: CategoryChipsProps): React.JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      {items.map((item) => (
        <Chip
          key={item.value}
          label={item.label}
          selected={item.value === selected}
          onPress={() => {
            onSelect(item.value);
          }}
          testID={`chip-${item.value}`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
});
