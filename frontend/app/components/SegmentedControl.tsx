import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, isActive && styles.segmentActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  segmentActive: {
    backgroundColor: "#4C6FFF",
  },
  label: {
    color: "#475569",
    fontWeight: "500",
  },
  labelActive: {
    color: "#FFFFFF",
  },
});