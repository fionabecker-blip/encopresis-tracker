import { useMemo, type ReactNode } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import AccentButton from "./AccentButton";
import { useTheme } from "../theme/useTheme";
import type { Theme } from "../theme/tokens";

type AppModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** Label on the dismiss button. */
  closeLabel?: string;
  children?: ReactNode;
};

/**
 * The one modal shell in the app: centered surface card, centered Lora title,
 * and an apricot dismiss button. Scrolls internally so a long explainer cannot
 * push its own dismiss button off screen on a small device.
 */
export default function AppModal({
  visible,
  title,
  onClose,
  closeLabel = "Done",
  children,
}: AppModalProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          <AccentButton title={closeLabel} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      // Scrim: a translucent deep teal rather than black, so dimming the screen
      // stays inside the palette instead of introducing a pure-black layer.
      backgroundColor: "rgba(15, 29, 27, 0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: t.spacing.gutter,
    },
    card: {
      width: "100%",
      maxWidth: 340,
      maxHeight: "85%",
      backgroundColor: t.colors.surface,
      borderRadius: t.radii.modal,
      padding: t.spacing.xxl,
      gap: t.spacing.lg,
    },
    title: {
      ...t.typography.sectionTitle,
      color: t.colors.textPrimary,
      textAlign: "center",
    },
    body: {
      gap: t.spacing.md,
    },
  });
