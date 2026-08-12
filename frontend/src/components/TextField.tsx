import { forwardRef, useCallback, useMemo, useState, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useTheme } from "../theme/useTheme";
import type { Theme } from "../theme/tokens";

// Derived from the props rather than imported: React Native renames these
// event types between versions.
type FocusHandler = NonNullable<TextInputProps["onFocus"]>;
type BlurHandler = NonNullable<TextInputProps["onBlur"]>;

type TextFieldProps = TextInputProps & {
  /** Optional label rendered above the input. */
  label?: string;
  /** Rendered to the right of the label — typically an info button. */
  labelAccessory?: ReactNode;
  /** Helper copy rendered below the input. */
  helperText?: string;
};

/**
 * Themed text input. The border changes color on focus but keeps its width, so
 * focusing never shifts layout. No glow or shadow by design.
 */
const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, labelAccessory, helperText, style, onFocus, onBlur, multiline, ...rest },
  ref
) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback<FocusHandler>(
    (e) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback<BlurHandler>(
    (e) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  return (
    <View style={styles.wrapper}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {labelAccessory}
        </View>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.placeholder}
        multiline={multiline}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.inputFocused,
          style,
        ]}
        {...rest}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
});

export default TextField;

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrapper: {
      gap: t.spacing.sm,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: t.spacing.sm,
    },
    label: {
      ...t.typography.label,
      color: t.colors.textSecondary,
      flexShrink: 1,
    },
    input: {
      backgroundColor: t.colors.inputFill,
      borderWidth: t.sizing.inputBorderWidth,
      borderColor: t.colors.border,
      borderRadius: t.radii.input,
      paddingVertical: t.spacing.md,
      paddingHorizontal: 14,
      minHeight: t.sizing.minTouch,
      ...t.typography.body,
      color: t.colors.textPrimary,
    },
    inputFocused: {
      borderColor: t.colors.primary,
    },
    multiline: {
      minHeight: 90,
      textAlignVertical: "top",
    },
    helper: {
      ...t.typography.caption,
      color: t.colors.textMuted,
    },
  });
