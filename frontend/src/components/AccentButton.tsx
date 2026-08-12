import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../theme/useTheme";
import type { Theme } from "../theme/tokens";

type AccentButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  style?: ViewStyle | ViewStyle[];
};

/**
 * Apricot action button. This is the ONLY place `accent` is used as a button
 * fill — it marks a reward moment (finishing a demo, dismissing an explainer)
 * and would stop reading as one if it appeared on ordinary screens.
 *
 * Flat, unlike `PrimaryButton`: the color is already doing the work.
 */
export default function AccentButton({ title, style, ...rest }: AccentButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
      {...rest}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    button: {
      backgroundColor: t.colors.accent,
      borderRadius: t.radii.modalAction,
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: t.spacing.xl,
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      ...t.typography.button,
      color: t.colors.onAccent,
    },
  });
