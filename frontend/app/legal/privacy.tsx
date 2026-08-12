import { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/useTheme";
import type { Theme } from "../../src/theme/tokens";

export default function PrivacyScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Privacy Policy</Text>

        <Text style={styles.sectionTitle}>Information Stored</Text>
        <Text style={styles.body}>
          The app may store information such as bowel logs, accidents, medication
          tracking, and sit routines. This information is stored only for the user’s
          tracking purposes.
        </Text>

        <Text style={styles.sectionTitle}>Data Usage</Text>
        <Text style={styles.body}>
          We do not collect, transmit, sell, or share any personal data. The app
          contains no analytics, advertising, or crash-reporting services.
        </Text>

        <Text style={styles.sectionTitle}>Local Storage</Text>
        <Text style={styles.body}>
          All data is stored only on this device, in encrypted form. There is no
          cloud syncing and no account — nothing ever leaves your device unless
          you explicitly export and share it yourself. Deleting the app
          permanently deletes all data.
        </Text>

        <Text style={styles.sectionTitle}>External Links</Text>
        <Text style={styles.body}>
          The app may contain links to external educational resources.
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
