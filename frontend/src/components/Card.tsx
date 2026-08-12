import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View, type ViewProps, type ViewStyle } from "react-native";
import { useTheme } from "../theme/useTheme";
import type { Theme } from "../theme/tokens";

type CardProps = ViewProps & {
  /** Optional heading rendered in the section title style. */
  title?: string;
  /** Rendered to the right of the title — typically an info button. */
  titleAccessory?: ReactNode;
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
};

/**
 * Flat content container. Separation comes from the border, never a shadow —
 * only the primary call-to-action is raised in this design system.
 */
export default function Card({
  title,
  titleAccessory,
  children,
  style,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.card, style]} {...rest}>
      {title ? (
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {titleAccessory}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function CardTitle({
  children,
  accessory,
}: {
  children: ReactNode;
  accessory?: ReactNode;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.titleRow}>
      <Text style={styles.title}>{children}</Text>
      {accessory}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radii.card,
      borderWidth: t.sizing.hairline,
      borderColor: t.colors.cardBorder,
      padding: t.spacing.cardPad,
      gap: t.spacing.sectionGap,
      ...t.shadows.none,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: t.spacing.sm,
    },
    title: {
      ...t.typography.sectionTitle,
      color: t.colors.textPrimary,
      flexShrink: 1,
    },
  });
