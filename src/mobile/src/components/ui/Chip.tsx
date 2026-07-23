import { Pressable, StyleSheet } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  testID?: string;
}

export function Chip({ label, selected = false, onPress, testID }: ChipProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.accent : theme.colors.bgSurface,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <AppText
        variant="caption"
        style={{
          color: selected ? theme.colors.accentText : theme.colors.text2,
          fontWeight: "600",
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
});
