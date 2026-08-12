import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import type { Theme } from "../theme/tokens";

type InfoIconProps = {
  /**
   * Muted variant, for an icon sitting on an unselected chip where a primary
   * stroke would compete with the chip's own border.
   */
  muted?: boolean;
  /** Cream variant, for an icon sitting on a selected (primary-filled) chip. */
  onPrimary?: boolean;
};

/**
 * Inline information affordance: an outlined circle, never filled. Drawn from
 * a View rather than the ⓘ glyph so the stroke weight matches the rest of the
 * system and does not drift with the font.
 *
 * Purely decorative — the tappable target and its accessibility label belong
 * to the pressable that wraps this.
 */
export default function InfoIcon({ muted = false, onPrimary = false }: InfoIconProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const color = onPrimary
    ? theme.colors.onPrimary
    : muted
    ? theme.colors.placeholder
    : theme.colors.primary;

  return (
    <View style={[styles.circle, { borderColor: color }]}>
      <Text style={[styles.glyph, { color }]} allowFontScaling={false}>
        i
      </Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    circle: {
      width: t.sizing.infoIcon,
      height: t.sizing.infoIcon,
      borderRadius: t.sizing.infoIcon / 2,
      borderWidth: t.sizing.infoIconBorderWidth,
      alignItems: "center",
      justifyContent: "center",
      // The stroke is the whole point; a fill would read as a filled badge.
      backgroundColor: "transparent",
    },
    glyph: {
      fontFamily: t.fontFamily.sansBold,
      fontSize: 9,
      // Matching the box height keeps the serif-less "i" optically centred.
      lineHeight: t.sizing.infoIcon,
    },
  });
