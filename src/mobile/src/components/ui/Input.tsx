import { forwardRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/useTheme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, leftIcon, rightIcon, style, ...rest },
  ref,
): React.JSX.Element {
  const theme = useTheme();
  const hasError = Boolean(error);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="caption" color="secondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.bgCard,
            borderColor: hasError ? theme.colors.error : theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.text3}
          style={[styles.input, { color: theme.colors.text1 }, style]}
          {...rest}
        />
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </View>
      {hasError ? (
        <AppText variant="caption" style={{ color: theme.colors.error }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    marginLeft: 4,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 50,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  icon: {
    justifyContent: "center",
  },
});
