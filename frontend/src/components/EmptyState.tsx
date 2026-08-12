import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import type { Theme } from "../theme/tokens";

type EmptyStateProps = {
  /** Short headline in the serif face. */
  title: string;
  /** One supporting line telling the parent what will fill this space. */
  body: string;
};

const STAGE_W = 132;
const STAGE_H = 92;
const GROUND_Y = 72;

/**
 * Placeholder shown before a screen has data. The figure is the same friendly
 * shape used in the exercise demos, shrunk onto a small tinted stage, so an
 * empty screen still feels like part of the app rather than an error.
 */
export default function EmptyState({ title, body }: EmptyStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.groundShadow} />
        <View style={styles.ground} />
        {/* head */}
        <View style={[styles.body, { left: 55, top: 20, width: 22, height: 22, borderRadius: 11 }]} />
        {/* torso */}
        <View style={[styles.body, { left: 50, top: 44, width: 32, height: 24, borderRadius: 12 }]} />
        {/* far arm */}
        <View style={[styles.limbFar, { left: 40, top: 46, width: 9, height: 20, borderRadius: 5 }]} />
        {/* near arm */}
        <View style={[styles.body, { left: 83, top: 46, width: 9, height: 20, borderRadius: 5 }]} />
        {/* feet */}
        <View style={[styles.extremity, { left: 52, top: 66, width: 12, height: 8, borderRadius: 4 }]} />
        <View style={[styles.extremity, { left: 68, top: 66, width: 12, height: 8, borderRadius: 4 }]} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body_}>{body}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrapper: {
      alignItems: "center",
      gap: t.spacing.sm,
      paddingVertical: t.spacing.sm,
    },
    stage: {
      width: STAGE_W,
      height: STAGE_H,
      backgroundColor: t.illustration.stage,
      borderRadius: t.radii.stage,
      overflow: "hidden",
      marginBottom: t.spacing.sm,
    },
    groundShadow: {
      position: "absolute",
      left: (STAGE_W - 64) / 2,
      top: GROUND_Y - 5,
      width: 64,
      height: 10,
      borderRadius: 5,
      backgroundColor: t.illustration.groundShadow,
    },
    ground: {
      position: "absolute",
      left: 14,
      right: 14,
      top: GROUND_Y,
      height: 3,
      borderRadius: 2,
      backgroundColor: t.illustration.groundLine,
    },
    body: {
      position: "absolute",
      backgroundColor: t.illustration.body,
      borderWidth: 2,
      borderColor: t.illustration.outline,
    },
    limbFar: {
      position: "absolute",
      backgroundColor: t.illustration.limbFar,
      borderWidth: 2,
      borderColor: t.illustration.outline,
    },
    extremity: {
      position: "absolute",
      backgroundColor: t.illustration.extremity,
      borderWidth: 2,
      borderColor: t.illustration.outline,
    },
    title: {
      ...t.typography.sectionTitle,
      color: t.colors.textPrimary,
      textAlign: "center",
    },
    // Trailing underscore: `body` is already taken by the figure's torso style.
    body_: {
      ...t.typography.caption,
      color: t.colors.textSecondary,
      textAlign: "center",
    },
  });
