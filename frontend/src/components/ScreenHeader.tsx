import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import type { Theme } from "../theme/tokens";

const KICKER = "ENCO TRACKER";

type ScreenHeaderProps = {
  title: string;
  /** Optional supporting line below the title. */
  subtitle?: string;
  /** Set false on nested pages that already sit under the brand. */
  showKicker?: boolean;
  children?: ReactNode;
};

/** Brand kicker above a screen title. */
export default function ScreenHeader({
  title,
  subtitle,
  showKicker = true,
  children,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      {showKicker ? (
        // The literal is already uppercase; textTransform is not applied so
        // screen readers announce the brand name normally.
        <Text style={styles.kicker} accessibilityRole="header">
          {KICKER}
        </Text>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    header: {
      gap: t.spacing.xs,
    },
    kicker: {
      ...t.typography.kicker,
      color: t.colors.primary,
    },
    title: {
      ...t.typography.screenTitle,
      color: t.colors.textPrimary,
    },
    subtitle: {
      ...t.typography.body,
      color: t.colors.textSecondary,
      marginTop: t.spacing.xs,
    },
  });
