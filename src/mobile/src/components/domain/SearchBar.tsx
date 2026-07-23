import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t } from "@/i18n";
import { useTheme } from "@/theme/useTheme";

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  loading?: boolean;
  placeholder?: string;
  testID?: string;
}

export function SearchBar({
  value,
  onChangeText,
  loading = false,
  placeholder,
  testID,
}: SearchBarProps): React.JSX.Element {
  const theme = useTheme();
  const showClear = value.length > 0;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.bgCard,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <Ionicons name="search" size={18} color={theme.colors.text3} />
      <TextInput
        style={[styles.input, { color: theme.colors.text1 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t("catalog.search.placeholderShort")}
        placeholderTextColor={theme.colors.text3}
        accessibilityLabel={t("catalog.search.ariaLabel")}
        autoCorrect={false}
        returnKeyType="search"
      />
      {loading ? <ActivityIndicator size="small" color={theme.colors.text3} /> : null}
      {showClear && !loading ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.actions.reset")}
          onPress={() => {
            onChangeText("");
          }}
          testID={`${testID ?? "search"}-clear`}
        >
          <Ionicons name="close-circle" size={18} color={theme.colors.text3} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
});
