import { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/useTheme";
import type { Theme } from "../../src/theme/tokens";

export default function MedicalDisclaimerScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Medical Disclaimer</Text>
        <Text style={styles.body}>
          This app is intended to help parents track bowel routines and symptoms in
          children with constipation or encopresis.
        </Text>
        <Text style={styles.body}>
          This app does not provide medical advice, diagnosis, or treatment. The
          information and educational resources included are for informational
          purposes only.
        </Text>
        <Text style={styles.body}>
          Always consult a qualified healthcare professional regarding your child’s
          medical care and treatment.
        </Text>
        <Text style={styles.body}>
          Use of this app is at your own discretion. The developers of this app are
          not responsible for medical decisions or health outcomes related to use of
          this app.
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
      gap: t.spacing.lg,
    },
    title: {
      ...t.typography.screenTitle,
      color: t.colors.textPrimary,
    },
    body: {
      ...t.typography.body,
      color: t.colors.textPrimary,
    },
  });
