import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MedicalDisclaimerScreen() {
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1E293B",
  },
});