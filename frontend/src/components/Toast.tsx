import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import type { Theme } from "../theme/tokens";

type ToastProps = {
  /** Message to show, or null to hide. Changing the text restarts the timer. */
  message: string | null;
  onDismiss: () => void;
  /** Milliseconds the toast stays up before dismissing itself. */
  duration?: number;
};

/**
 * Bottom confirmation toast. Deliberately understated: it acknowledges that a
 * log was written, so it must never read as praise for a medical result.
 */
export default function Toast({ message, onDismiss, duration = 3200 }: ToastProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;

    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, duration);

    return () => clearTimeout(timer);
    // `onDismiss` is intentionally excluded: an inline arrow from the parent
    // would otherwise restart the timer on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, duration, progress]);

  if (!message) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { opacity: progress, transform: [{ translateY }] }]}
    >
      <View style={styles.badge}>
        <Text style={styles.check} allowFontScaling={false}>
          {"\u2713"}
        </Text>
      </View>
      <Text style={styles.label}>{message}</Text>
    </Animated.View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    toast: {
      position: "absolute",
      left: t.spacing.gutter,
      right: t.spacing.gutter,
      bottom: t.spacing.gutter,
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.md,
      backgroundColor: t.colors.primary,
      borderRadius: t.radii.button,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      ...t.shadows.cta,
    },
    badge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: t.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    check: {
      fontFamily: t.fontFamily.sansBold,
      fontSize: 12,
      lineHeight: 20,
      color: t.colors.onPrimary,
    },
    label: {
      ...t.typography.label,
      color: t.colors.onPrimary,
      flex: 1,
    },
  });
