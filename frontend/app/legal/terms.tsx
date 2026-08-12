import { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/useTheme";
import type { Theme } from "../../src/theme/tokens";

export default function TermsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Terms of Use</Text>

        <Text style={styles.sectionTitle}>Purpose of the App</Text>
        <Text style={styles.body}>
          This app provides tools for parents to log bowel routines, accidents, and
          related information for children experiencing constipation or encopresis.
        </Text>

        <Text style={styles.sectionTitle}>Medical Disclaimer</Text>
        <Text style={styles.body}>
          This app does not provide medical advice and does not replace consultation
          with a healthcare professional.
        </Text>

        <Text style={styles.sectionTitle}>User Responsibility</Text>
        <Text style={styles.body}>
          Users are responsible for any medical decisions regarding their child’s
          care.
        </Text>

        <Text style={styles.sectionTitle}>External Resources</Text>
        <Text style={styles.body}>
          The app may link to educational materials from third parties. The app
          developers do not control or endorse those materials.
        </Text>

        <Text style={styles.sectionTitle}>Liability Limitation</Text>
        <Text style={styles.body}>
          The developers of this app are not responsible for medical outcomes related
          to use of this app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    container: {
      padding: t.spacing.gutter,
      gap: t.spacing.sectionGap,
    },
    title: {
      ...t.typography.screenTitle,
      color: t.colors.textPrimary,
    },
    sectionTitle: {
      ...t.typography.sectionTitle,
      color: t.colors.textPrimary,
      marginTop: t.spacing.sm,
    },
    body: {
      ...t.typography.body,
      color: t.colors.textPrimary,
    },
  });
