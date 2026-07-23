import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";

export interface RatingProps {
  value: number;
  size?: number;
  showValue?: boolean;
}

export function Rating({ value, size = 14, showValue = true }: RatingProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={size} color={theme.colors.warning} />
      {showValue ? (
        <AppText variant="caption" color="secondary" style={styles.value}>
          {value.toFixed(1)}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontWeight: "600",
  },
});
