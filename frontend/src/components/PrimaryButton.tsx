import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../theme/useTheme";
import type { Theme } from "../theme/tokens";

type PrimaryButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  /** Shows a spinner in place of the label and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
};

/**
 * The single raised element in the design system. Everything else is flat.
 */
export default function PrimaryButton({
  title,
  loading = false,
  disabled = false,
  style,
  ...rest
}: PrimaryButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.onPrimary} />
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    button: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radii.button,
      height: t.sizing.ctaHeight,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: t.spacing.xl,
      ...t.shadows.cta,
    },
    pressed: {
      backgroundColor: t.colors.primaryDark,
    },
    disabled: {
      opacity: 0.6,
    },
    label: {
      ...t.typography.button,
      color: t.colors.onPrimary,
    },
  });
