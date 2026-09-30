import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useTheme } from "../../src/theme/useTheme";
import type { Theme } from "../../src/theme/tokens";

type Option = { label: string; value: string };

type SegmentedControlProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
};

export default function SegmentedControl({
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { segmentPad, segmentGap } = theme.sizing;
  const count = options.length;

  // Measured once on layout; the thumb can only be positioned in absolute
  // pixels, so it stays hidden until we know how wide a segment is.
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentWidth =
    trackWidth > 0
      ? (trackWidth - segmentPad * 2 - segmentGap * (count - 1)) / count
      : 0;

  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const offset = useRef(new Animated.Value(0)).current;
  const positioned = useRef(false);

  useEffect(() => {
    if (segmentWidth === 0) return;
    const to = segmentPad + activeIndex * (segmentWidth + segmentGap);
    // Snap rather than animate on the first measured layout, otherwise the
    // thumb visibly slides in from the left edge on mount.
    if (!positioned.current) {
      positioned.current = true;
      offset.setValue(to);
      return;
    }
    Animated.timing(offset, {
      toValue: to,
      duration: theme.durations.segmentThumb,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, segmentWidth, segmentPad, segmentGap, offset, theme.durations.segmentThumb]);

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.track} onLayout={onLayout}>
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            { width: segmentWidth, transform: [{ translateX: offset }] },
          ]}
        />
      ) : null}
      {options.map((option, i) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, i > 0 && { marginLeft: segmentGap }]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: t.colors.segmentTrack,
      borderRadius: t.radii.segmentTrack,
      padding: t.sizing.segmentPad,
      // `minHeight`, not `height`: a label long enough to wrap (e.g.
      // "Suppository-induced BM") would otherwise be clipped by the track. The
      // thumb is pinned to the track's top and bottom, so it grows to match.
      minHeight: t.sizing.segmentHeight,
    },
    thumb: {
      position: "absolute",
      top: t.sizing.segmentPad,
      left: 0,
      bottom: t.sizing.segmentPad,
      backgroundColor: t.colors.primary,
      borderRadius: t.radii.segmentThumb,
      ...t.shadows.segmentThumb,
    },
    segment: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: t.radii.segmentThumb,
    },
    label: {
      ...t.typography.segmentLabel,
      color: t.colors.segmentText,
      // Wrapped labels are full-width Text blocks, so without this the second
      // line hangs left instead of staying centred under the first.
      textAlign: "center",
    },
    labelActive: {
      color: t.colors.onPrimary,
    },
  });
