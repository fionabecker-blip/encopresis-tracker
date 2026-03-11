import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

const resources = [
  {
    title: "Encopresis overview",
    description: "Placeholder summary for parents and caregivers.",
    url: "https://example.com/encopresis-overview",
  },
  {
    title: "Bowel management routines",
    description: "Placeholder protocol checklist and tips.",
    url: "https://example.com/bowel-management",
  },
  {
    title: "Hydration and fiber tips",
    description: "Placeholder nutrition guidance.",
    url: "https://example.com/hydration-fiber",
  },
  {
    title: "Support for families",
    description: "Placeholder community resources.",
    url: "https://example.com/family-support",
  },
];

export default function ResourcesScreen() {
  const openLink = async (url) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Resources</Text>
        <Text style={styles.subtitle}>External links open in your browser.</Text>
        <View style={styles.list}>
          {resources.map((resource) => (
            <TouchableOpacity
              key={resource.url}
              style={styles.card}
              onPress={() => openLink(resource.url)}
            >
              <Text style={styles.cardTitle}>{resource.title}</Text>
              <Text style={styles.cardDescription}>{resource.description}</Text>
              <Text style={styles.cardLink}>{resource.url}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  cardDescription: {
    color: "#475569",
    fontSize: 13,
  },
  cardLink: {
    color: "#4C6FFF",
    fontSize: 12,
  },
});