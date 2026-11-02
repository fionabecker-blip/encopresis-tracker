import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../src/components/Icon";
import { useTheme } from "../src/theme/useTheme";
import type { Theme } from "../src/theme/tokens";

export default function DisclaimerScreen({ onAccept }) {
  const [checked, setChecked] = useState(false);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const handleExit = () => {
    if (Platform.OS === "android") {
      const BackHandler = require("react-native").BackHandler;
      BackHandler.exitApp();
      return;
    }
    Alert.alert("Exit App", "Please close the app from the app switcher.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Important Information</Text>

        <Text style={styles.bodyText}>
          Created by parents of a child who experienced encopresis, this app helps
          families track bowel routines and symptoms in children with constipation or
          encopresis.
        </Text>
        <Text style={styles.bodyText}>
          This app does not provide medical advice, diagnosis, or treatment. The
          information and educational resources included in the app are for
          informational purposes only.
        </Text>
        <Text style={styles.bodyText}>
          Always consult a qualified healthcare professional regarding your child’s
          medical care and treatment.
        </Text>
        <Text style={styles.bodyText}>
          Some resources in the app may link to external educational materials from
          pediatric specialists, children’s hospitals, or other organizations. These
          resources are provided for informational purposes only. This app is not
          affiliated with any of the externally linked material or owners thereof.
        </Text>
        <Text style={styles.bodyText}>
          Use of this app is at your own discretion. The developers of this app are not
          responsible for medical decisions or health outcomes related to use of this
          app.
        </Text>

        {/* Tinted rather than another body paragraph: this screen is a wall of
            legal text people scroll past, and the one thing here that is about
            the child rather than about liability should not look identical to
            the rest. Sits directly above the checkbox, the last thing read
            before agreeing. Matches the note in the Daily Log so the treatment
            reads as one consistent voice. */}
        <View style={styles.consentNote}>
          <Text style={styles.consentNoteTitle}>Never force a suppository</Text>
          <Text style={styles.consentNoteText}>
            Whatever program or protocol you are following, this app’s position is
            the same: a suppository should never be forced on a child who is
            resisting, frightened, or saying no. Stop, and speak to your clinician
            about other options.
          </Text>
        </View>

        <Pressable style={styles.checkboxRow} onPress={() => setChecked((prev) => !prev)}>
          <Icon
            name={checked ? "checkboxOn" : "checkboxOff"}
            size={22}
            color={checked ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text style={styles.checkboxText}>
            I understand this app does not provide medical advice.
          </Text>
        </Pressable>

        <TouchableOpacity
          style={[styles.primaryButton, !checked && styles.primaryButtonDisabled]}
          disabled={!checked}
          onPress={onAccept}
        >
          <Text style={styles.primaryButtonText}>I Agree</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleExit}>
          <Text style={styles.secondaryButtonText}>Exit App</Text>
        </TouchableOpacity>
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
      gap: t.spacing.cardGap,
    },
    title: {
      ...t.typography.screenTitle,
      color: t.colors.textPrimary,
    },
    bodyText: {
      ...t.typography.body,
      color: t.colors.textPrimary,
    },
    // Warning tint, not danger: a guardrail, never an accusation aimed at a
    // parent who is already having a hard day.
    consentNote: {
      backgroundColor: t.colors.warningTint,
      borderRadius: t.radii.input,
      padding: t.spacing.lg,
      gap: t.spacing.sm,
    },
    consentNoteTitle: {
      ...t.typography.sectionTitle,
      color: t.colors.textPrimary,
    },
    consentNoteText: {
      ...t.typography.body,
      color: t.colors.textPrimary,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.md,
      marginTop: t.spacing.sm,
    },
    checkboxText: {
      ...t.typography.body,
      color: t.colors.textPrimary,
      flex: 1,
    },
    primaryButton: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radii.button,
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      ...t.typography.button,
      color: t.colors.onPrimary,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radii.button,
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.colors.surface,
    },
    secondaryButtonText: {
      ...t.typography.button,
      color: t.colors.textPrimary,
    },
  });
