import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import Card, { CardTitle } from "../../src/components/Card";
import ScreenHeader from "../../src/components/ScreenHeader";
import { useTheme } from "../../src/theme/useTheme";
import type { Theme } from "../../src/theme/tokens";

const howToSteps = [
  {
    title: "1. Log once a day",
    body:
      "Open the Daily Log tab, pick the date, and fill in what you know \u2014 accidents, leaks/smears, BMs, meds, foods, sits. Nothing is required; log what you have and tap Save. An evening routine (after bath, before bed) works well, and you can turn on a daily reminder in Settings.",
  },
  {
    title: "2. Answer the yes/no questions",
    body:
      "The yes/no toggles (leaks/smears, clean out, timed sits, sitting position, activity, pain, withholding) default to No \u2014 just tap Yes when something happened. Tap any \u24D8 icon to see what a term means.",
  },
  {
    title: "3. Make the app yours in Settings",
    body:
      "Add your child\u2019s name (it appears on reports), set water units, and add custom medications and custom foods so they show up as one-tap chips on the Daily Log. You can also schedule timed-sit reminders about 20 minutes after meals.",
  },
  {
    title: "4. Watch the History calendar",
    body:
      "The History tab shows every entry as a list or a calendar. Green days = no accidents, leaks, or smears; amber days = at least one. Growing patches of green are your progress at a glance.",
  },
  {
    title: "5. Check Progress before appointments",
    body:
      "The Progress tab charts trends over time. Before a clinician visit, use Export CSV or Export PDF in History to share the full log \u2014 the PDF includes a summary page your care team can read in seconds.",
  },
  {
    title: "6. Your data stays on your device",
    body:
      "Everything is stored encrypted on this phone only \u2014 no account, no cloud. Nothing leaves the device unless you export and share it yourself.",
  },
];

const resources = [
  {
    title: "Encopresis overview (Cincinnati Children’s)",
    description: "Trusted clinical overview from Cincinnati Children’s.",
    url: "https://www.cincinnatichildrens.org/health/e/encopresis",
  },
  {
    title: "Encopresis video playlist",
    description: "Educational video series for families and caregivers.",
    url: "https://www.youtube.com/playlist?list=PLDMTl_ErA3Yc",
  },
];

// Kept out of `resources` because this one is introduced by a note that only
// makes sense directly above it.
const fiberNote =
  "A note on fiber: One of the first things parents try is adding more fiber. It makes sense \u2014 but in encopresis, it can make things worse. If there\u2019s already a blockage, adding fiber adds to it. The colon needs to be cleared first. The article below explains why.";

const fiberResource = {
  title: "Why \u201cjust add fiber\u201d can backfire in encopresis (NLM)",
  description:
    "Clinical review of fiber\u2019s role in childhood GI disorders \u2014 and why disimpaction must come first.",
  url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6267171/",
};

export default function ResourcesScreen() {
  const [showHowTo, setShowHowTo] = useState(false);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const openLink = async (url) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title="Resources"
          subtitle="External links open in your browser."
        />

        <Card>
          <TouchableOpacity onPress={() => setShowHowTo((prev) => !prev)}>
            <CardTitle>How to use this app</CardTitle>
            <Text style={styles.cardDescription}>
              {showHowTo
                ? "A quick guide to daily logging, settings, and reports."
                : "Tap to see a quick guide to daily logging, settings, and reports."}
            </Text>
          </TouchableOpacity>
          {showHowTo
            ? howToSteps.map((step) => (
                <View key={step.title} style={styles.howToStep}>
                  <Text style={styles.howToTitle}>{step.title}</Text>
                  <Text style={styles.howToBody}>{step.body}</Text>
                </View>
              ))
            : null}
        </Card>

        <Text style={styles.attribution}>
          Educational resources from pediatric specialists and children’s hospitals are
          provided for informational purposes. This app is not affiliated with any of
          the externally linked material or owners thereof.
        </Text>
        <View style={styles.list}>
          {resources.map((resource) => (
            <TouchableOpacity
              key={resource.url}
              onPress={() => openLink(resource.url)}
            >
              <Card title={resource.title}>
                <Text style={styles.cardDescription}>{resource.description}</Text>
                <Text style={styles.cardLink}>{resource.url}</Text>
              </Card>
            </TouchableOpacity>
          ))}

          <Text style={styles.note}>{fiberNote}</Text>
          <TouchableOpacity onPress={() => openLink(fiberResource.url)}>
            <Card title={fiberResource.title}>
              <Text style={styles.cardDescription}>{fiberResource.description}</Text>
              <Text style={styles.cardLink}>{fiberResource.url}</Text>
            </Card>
          </TouchableOpacity>
        </View>
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
    attribution: {
      ...t.typography.caption,
      color: t.colors.textSecondary,
    },
    list: {
      gap: t.spacing.md,
    },
    /** Framing copy that introduces the link directly beneath it. */
    note: {
      ...t.typography.caption,
      color: t.colors.textSecondary,
      marginTop: t.spacing.sm,
    },
    cardDescription: {
      ...t.typography.body,
      color: t.colors.textSecondary,
    },
    cardLink: {
      ...t.typography.caption,
      color: t.colors.primary,
    },
    howToStep: {
      gap: t.spacing.xs,
      marginTop: t.spacing.sm,
    },
    howToTitle: {
      ...t.typography.label,
      color: t.colors.textPrimary,
    },
    howToBody: {
      ...t.typography.body,
      color: t.colors.textSecondary,
    },
  });