import { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";

export default function DisclaimerScreen({ onAccept }) {
  const [checked, setChecked] = useState(false);

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
          This app is intended to help parents track bowel routines and symptoms in
          children with constipation or encopresis.
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
          This app was created by parents of a child who experienced encopresis and is
          intended as a supportive tracking tool for families.
        </Text>
        <Text style={styles.bodyText}>
          Some resources in the app may link to external educational materials from
          pediatric specialists, children’s hospitals, or other organizations. These
          resources are provided for informational purposes only. This app is not
          affiliated with or endorsed by the creators of those materials or medical
          protocols.
        </Text>
        <Text style={styles.bodyText}>
          Use of this app is at your own discretion. The developers of this app are not
          responsible for medical decisions or health outcomes related to use of this
          app.
        </Text>

        <Pressable style={styles.checkboxRow} onPress={() => setChecked((prev) => !prev)}>
          <Ionicons
            name={checked ? "checkbox" : "square-outline"}
            size={22}
            color={checked ? "#4C6FFF" : "#94A3B8"}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1E293B",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  checkboxText: {
    color: "#1E293B",
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#4C6FFF",
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#1E293B",
    fontWeight: "600",
    fontSize: 16,
  },
});