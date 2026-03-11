import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SegmentedControl from "../components/SegmentedControl";
import { apiSend } from "../utils/api";
import { defaultSettings, loadSettings } from "../utils/storage";

const bmOptions = [
  { label: "SP", value: "sp" },
  { label: "Enema", value: "enema" },
  { label: "None", value: "none" },
];

const yesNoOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const medsOptions = [
  { label: "Miralax/Restoralax/PEG", value: "Miralax/Restoralax/PEG" },
  { label: "SENNA/exlax", value: "SENNA/exlax" },
  { label: "LGS", value: "LGS" },
  { label: "Multi-Mop", value: "Multi-Mop" },
  { label: "MOP x", value: "MOP x" },
];

export default function LogScreen() {
  const [dateValue, setDateValue] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fecalAccidents, setFecalAccidents] = useState("");
  const [urineAccidents, setUrineAccidents] = useState("");
  const [leaks, setLeaks] = useState("no");
  const [medsProtocol, setMedsProtocol] = useState("");
  const [bmType, setBmType] = useState("none");
  const [bmNotes, setBmNotes] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [fiberIntake, setFiberIntake] = useState("");
  const [activity30Min, setActivity30Min] = useState("no");
  const [notes, setNotes] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);


  const parseNumber = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const resetForm = () => {
    setFecalAccidents("");
    setUrineAccidents("");
    setLeaks("no");
    setMedsProtocol("");
    setBmType("none");
    setBmNotes("");
    setWaterIntake("");
    setFiberIntake("");
    setActivity30Min("no");
    setNotes("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setStatus("");
    try {
      const payload = {
        date: dateValue,
        bm_type: bmType,
        leaks: leaks === "yes",
        activity_30_min: activity30Min === "yes",
      };

      const fecal = parseNumber(fecalAccidents);
      const urine = parseNumber(urineAccidents);
      const water = parseNumber(waterIntake);
      const fiber = parseNumber(fiberIntake);

      if (fecal !== undefined) payload.fecal_accidents = fecal;
      if (urine !== undefined) payload.urine_accidents = urine;
      if (medsProtocol) payload.medication = medsProtocol;
      if (bmNotes.trim()) payload.bm_notes = bmNotes.trim();
      if (water !== undefined) {
        payload.water_intake = water;
        payload.water_unit = settings.waterUnit;
      }
      if (fiber !== undefined) {
        payload.fiber_intake = fiber;
        payload.fiber_unit = settings.fiberUnit;
      }
      if (notes.trim()) payload.notes = notes.trim();

      await apiSend("/entries", "POST", payload);
      resetForm();
      setStatus("Saved entry for the day.");
    } catch (error) {
      setStatus("Could not save the entry. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.section}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              value={dateValue}
              onChangeText={setDateValue}
              placeholder="2026-01-31"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accidents</Text>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Fecal accidents</Text>
                <TextInput
                  value={fecalAccidents}
                  onChangeText={setFecalAccidents}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Urine accidents</Text>
                <TextInput
                  value={urineAccidents}
                  onChangeText={setUrineAccidents}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.stack}>
              <Text style={styles.label}>Leaks</Text>
              <SegmentedControl
                options={yesNoOptions}
                value={leaks}
                onChange={setLeaks}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bowel movements</Text>
            <SegmentedControl options={bmOptions} value={bmType} onChange={setBmType} />
            {bmType !== "none" ? (
              <View style={styles.stack}>
                <Text style={styles.label}>BM notes (optional)</Text>
                <TextInput
                  value={bmNotes}
                  onChangeText={setBmNotes}
                  placeholder="Any details about SP/enema"
                  style={styles.input}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meds/Protocol</Text>
            <Text style={styles.helperText}>Tap an option to select. Tap again to clear.</Text>
            <View style={styles.chipRow}>
              {medsOptions.map((option) => {
                const isActive = medsProtocol === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setMedsProtocol(isActive ? "" : option.value)}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hydration</Text>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Water ({settings.waterUnit})</Text>
                <TextInput
                  value={waterIntake}
                  onChangeText={setWaterIntake}
                  placeholder="Optional"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Fiber ({settings.fiberUnit})</Text>
                <TextInput
                  value={fiberIntake}
                  onChangeText={setFiberIntake}
                  placeholder="Optional"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physical activity (30 min+)</Text>
            <SegmentedControl
              options={yesNoOptions}
              value={activity30Min}
              onChange={setActivity30Min}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional context for clinicians"
              style={[styles.input, styles.multiline]}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Save daily entry</Text>
            )}
          </TouchableOpacity>

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  label: {
    fontSize: 14,
    color: "#475569",
  },
  helperText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    fontSize: 15,
    minHeight: 44,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    minHeight: 36,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "#4C6FFF",
    borderColor: "#4C6FFF",
  },
  chipText: {
    color: "#1E293B",
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  stack: {
    gap: 8,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#4C6FFF",
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  status: {
    textAlign: "center",
    color: "#1E293B",
    fontWeight: "500",
  },
});