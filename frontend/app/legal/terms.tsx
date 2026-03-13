import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsScreen() {
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