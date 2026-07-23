import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/useTheme";

export interface DividerProps {
  spacing?: number;
}

export function Divider({ spacing = 0 }: DividerProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.line,
        { backgroundColor: theme.colors.border, marginVertical: spacing },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});
