import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
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
          The app does not sell or share personal data.
        </Text>

        <Text style={styles.sectionTitle}>Local Storage</Text>
        <Text style={styles.body}>
          User data is stored locally on the device unless cloud syncing is enabled.
        </Text>

        <Text style={styles.sectionTitle}>External Links</Text>
        <Text style={styles.body}>
          The app may contain links to external educational resources.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1E293B",
  },
});