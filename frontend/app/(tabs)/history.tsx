import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { apiGet } from "../utils/api";
import { Calendar } from "react-native-calendars";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import SegmentedControl from "../components/SegmentedControl";

const CalendarDay = ({ date, state, marking }) => {
  if (!date) return null;
  const marker = marking?.markers;
  return (
    <TouchableOpacity
      style={styles.dayCell}
      onPress={() => marking?.onPress?.(date.dateString)}
    >
      <Text
        style={[
          styles.dayText,
          state === "disabled" && styles.dayTextDisabled,
          marking?.selected && styles.dayTextSelected,
        ]}
      >
        {date.day}
      </Text>
      <View style={styles.markerRow}>
        {marker?.hasBm ? (
          <MaterialCommunityIcons name="toilet" size={12} color="#2563EB" />
        ) : null}
        {marker?.fecal ? <Ionicons name="water" size={10} color="#7C3F1D" /> : null}
        {marker?.urine ? <Ionicons name="water" size={10} color="#FACC15" /> : null}
        {marker?.leaks ? <Ionicons name="water" size={10} color="#F97316" /> : null}
      </View>
    </TouchableOpacity>
  );
};

export default function HistoryScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedDate, setSelectedDate] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setStatus("");
    try {
      const data = await apiGet("/entries");
      setEntries(data);
    } catch (error) {
      setStatus("Could not load entries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "Not logged";
    return value.toString();
  };

  const formatText = (value) => {
    if (!value) return "Not logged";
    return value;
  };

  const formatBoolean = (value) => {
    if (value === null || value === undefined) return "Not logged";
    return value ? "Yes" : "No";
  };

  const normalizeMedicationLabel = (value) => {
    if (!value) return "";
    const normalized = value.toLowerCase();
    if (
      normalized.includes("miralax") ||
      normalized.includes("restoralax") ||
      normalized.includes("restorolax") ||
      normalized.includes("peg")
    ) {
      return "Miralax/Restorolax/PEG";
    }
    if (normalized.includes("senna") || normalized.includes("exlax")) {
      return "Senna/Exlax";
    }
    if (normalized.includes("mag citrate")) {
      return "Mag citrate";
    }
    if (normalized.includes("multi-mop") || normalized.includes("multi mop")) {
      return "Multi-Mop";
    }
    if (normalized.includes("mop x") || normalized.includes("mopx")) {
      return "MOP x";
    }
    if (normalized.includes("lgs")) {
      return "LGS";
    }
    if (normalized.includes("none")) {
      return "None/Not taken";
    }
    return value;
  };

  const formatMedication = (value) => {
    if (value === null || value === undefined) return "Not logged";
    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => normalizeMedicationLabel(item))
        .filter(Boolean);
      return normalized.length ? Array.from(new Set(normalized)).join(", ") : "Not logged";
    }
    return normalizeMedicationLabel(value) || "Not logged";
  };

  const formatMedicationExport = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => normalizeMedicationLabel(item))
        .filter(Boolean);
      return Array.from(new Set(normalized)).join(" | ");
    }
    return normalizeMedicationLabel(value);
  };

  const formatMedicationDoses = (value) => {
    if (!value || typeof value !== "object") return "Not logged";
    const entries = Object.entries(value)
      .filter(([, dose]) => dose)
      .map(([med, dose]) => `${normalizeMedicationLabel(med)}: ${dose}`);
    return entries.length ? entries.join(", ") : "Not logged";
  };

  const formatMedicationDosesExport = (value) => {
    if (!value || typeof value !== "object") return "";
    const entries = Object.entries(value)
      .filter(([, dose]) => dose)
      .map(([med, dose]) => `${normalizeMedicationLabel(med)}: ${dose}`);
    return entries.join(" | ");
  };

  const formatPoopConsistency = (value) => {
    if (!value) return "Not logged";
    if (value === "soft_normal") return "Soft / normal";
    if (value === "hard_constipated") return "Hard / constipated";
    if (value === "very_loose") return "Very loose";
    return value;
  };

  const formatMotilityFoods = (value) => {
    if (value === null || value === undefined) return "Not logged";
    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "Not logged";
    }
    return value || "Not logged";
  };

  const formatMotilityFoodsExport = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      return value.join(" | ");
    }
    return value;
  };

  const entriesByDate = entries.reduce((acc, entry) => {
    if (!entry.date) return acc;
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const selectedEntries = selectedDate ? entriesByDate[selectedDate] || [] : [];

  const dateMarkers = entries.reduce((acc, entry) => {
    if (!entry.date) return acc;
    const fecal = entry.fecal_accidents ? entry.fecal_accidents > 0 : false;
    const urine = entry.urine_accidents ? entry.urine_accidents > 0 : false;
    const leaks = entry.leaks;
    const bmType = (entry.bm_type || "").toLowerCase();
    const hasBm = bmType.includes("sp") || bmType.includes("enema");
    acc[entry.date] = {
      hasBm,
      fecal,
      urine,
      leaks,
    };
    return acc;
  }, {});

  const markedDates = Object.keys(dateMarkers).reduce((acc, date) => {
    acc[date] = { markers: dateMarkers[date], onPress: setSelectedDate };
    return acc;
  }, {});

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || { markers: {} }),
      selected: true,
      onPress: setSelectedDate,
    };
  }

  const buildCsv = () => {
    const header = [
      "Date",
      "Fecal accidents",
      "Urine accidents",
      "Leaks",
      "BM type",
      "BM notes",
      "Poop consistency",
      "Meds/Protocol",
      "Medication amounts",
      "Hydration/Diet",
      "Water intake",
      "Water unit",
      "Fiber intake",
      "Fiber unit",
      "Clean out",
      "Clean out notes",
      "Timed sits completed",
      "Activity 30 min",
      "Notes",
    ];
    const rows = entries.map((entry) => [
      entry.date,
      entry.fecal_accidents ?? "",
      entry.urine_accidents ?? "",
      entry.leaks === undefined ? "" : entry.leaks ? "Yes" : "No",
      entry.bm_type ?? "",
      entry.bm_notes ?? "",
      formatPoopConsistency(entry.poop_consistency),
      formatMedicationExport(entry.medication),
      formatMedicationDosesExport(entry.medication_doses),
      formatMotilityFoodsExport(entry.motility_foods),
      entry.water_intake ?? "",
      entry.water_unit ?? "",
      entry.fiber_intake ?? "",
      entry.fiber_unit ?? "",
      entry.clean_out === undefined ? "" : entry.clean_out ? "Yes" : "No",
      entry.clean_out_notes ?? "",
      entry.timed_sits_completed === undefined ? "" : entry.timed_sits_completed ? "Yes" : "No",
      entry.activity_30_min === undefined ? "" : entry.activity_30_min ? "Yes" : "No",
      entry.notes ?? "",
    ]);
    return [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
  };

  const handleExportCsv = async () => {
    if (!entries.length) {
      setStatus("Add entries before exporting.");
      return;
    }
    try {
      const csv = buildCsv();
      const fileUri = `${FileSystem.documentDirectory}bowel-log.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Share CSV",
      });
    } catch (error) {
      setStatus("Unable to export CSV.");
    }
  };

  const buildHtml = () => {
    const rows = entries
      .map(
        (entry) => `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.fecal_accidents ?? ""}</td>
          <td>${entry.urine_accidents ?? ""}</td>
          <td>${entry.leaks === undefined ? "" : entry.leaks ? "Yes" : "No"}</td>
          <td>${entry.bm_type ?? ""}</td>
          <td>${entry.bm_notes ?? ""}</td>
          <td>${formatPoopConsistency(entry.poop_consistency)}</td>
          <td>${formatMedicationExport(entry.medication)}</td>
          <td>${formatMedicationDosesExport(entry.medication_doses)}</td>
          <td>${formatMotilityFoodsExport(entry.motility_foods)}</td>
          <td>${entry.water_intake ?? ""} ${entry.water_unit ?? ""}</td>
          <td>${entry.fiber_intake ?? ""} ${entry.fiber_unit ?? ""}</td>
          <td>${entry.clean_out === undefined ? "" : entry.clean_out ? "Yes" : "No"}</td>
          <td>${entry.clean_out_notes ?? ""}</td>
          <td>${entry.timed_sits_completed === undefined ? "" : entry.timed_sits_completed ? "Yes" : "No"}</td>
          <td>${entry.activity_30_min === undefined ? "" : entry.activity_30_min ? "Yes" : "No"}</td>
          <td>${entry.notes ?? ""}</td>
        </tr>`
      )
      .join("");

    return `
      <html>
        <body style="font-family: Helvetica, Arial; padding: 16px;">
          <h2>Bowel Movement Daily Log</h2>
          <table style="border-collapse: collapse; width: 100%; font-size: 12px;">
            <thead>
              <tr>
                <th style="border: 1px solid #ccc; padding: 6px;">Date</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Fecal accidents</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Urine accidents</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Leaks</th>
                <th style="border: 1px solid #ccc; padding: 6px;">BM type</th>
                <th style="border: 1px solid #ccc; padding: 6px;">BM notes</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Poop consistency</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Meds/Protocol</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Medication amounts</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Hydration/Diet</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Water</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Fiber</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Clean out</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Clean out notes</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Timed sits</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Activity 30 min</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  const handleExportPdf = async () => {
    if (!entries.length) {
      setStatus("Add entries before exporting.");
      return;
    }
    try {
      const html = buildHtml();
      const file = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(file.uri, { dialogTitle: "Share PDF" });
    } catch (error) {
      setStatus("Unable to export PDF.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Daily history</Text>
          <View style={styles.exportRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleExportCsv}>
              <Text style={styles.secondaryButtonText}>Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleExportPdf}>
              <Text style={styles.secondaryButtonText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SegmentedControl
          options={[
            { label: "List", value: "list" },
            { label: "Calendar", value: "calendar" },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />

        {loading ? <ActivityIndicator color="#4C6FFF" /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {!loading && entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No entries yet. Add a daily log to view history.
            </Text>
          </View>
        ) : null}

        {viewMode === "calendar" ? (
          <View style={styles.calendarCard}>
            <Calendar
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              dayComponent={CalendarDay}
            />

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <MaterialCommunityIcons name="toilet" size={14} color="#2563EB" />
                <Text style={styles.legendText}>BM</Text>
              </View>
              <View style={styles.legendItem}>
                <Ionicons name="water" size={12} color="#7C3F1D" />
                <Text style={styles.legendText}>Fecal accident</Text>
              </View>
              <View style={styles.legendItem}>
                <Ionicons name="water" size={12} color="#FACC15" />
                <Text style={styles.legendText}>Urine accident</Text>
              </View>
              <View style={styles.legendItem}>
                <Ionicons name="water" size={12} color="#F97316" />
                <Text style={styles.legendText}>Leak</Text>
              </View>
            </View>

            <View style={styles.selectedSection}>
              <Text style={styles.sectionTitle}>
                {selectedDate ? `Entries for ${selectedDate}` : "Select a date"}
              </Text>
              {selectedEntries.length === 0 ? (
                <Text style={styles.emptyText}>No entries for this day.</Text>
              ) : (
                selectedEntries.map((entry) => (
                  <View key={entry.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{entry.date}</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fecal accidents</Text>
                      <Text style={styles.detailValue}>
                        {formatNumber(entry.fecal_accidents)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Urine accidents</Text>
                      <Text style={styles.detailValue}>
                        {formatNumber(entry.urine_accidents)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Leaks</Text>
                      <Text style={styles.detailValue}>{formatBoolean(entry.leaks)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>BM type</Text>
                      <Text style={styles.detailValue}>{formatText(entry.bm_type)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Poop consistency</Text>
                      <Text style={styles.detailValue}>
                        {formatPoopConsistency(entry.poop_consistency)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Meds/Protocol</Text>
                      <Text style={styles.detailValue}>
                        {formatMedication(entry.medication)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Medication amounts</Text>
                      <Text style={styles.detailValue}>
                        {formatMedicationDoses(entry.medication_doses)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Clean out</Text>
                      <Text style={styles.detailValue}>
                        {formatBoolean(entry.clean_out)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Timed sits completed</Text>
                      <Text style={styles.detailValue}>
                        {formatBoolean(entry.timed_sits_completed)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.card}>
              <Text style={styles.cardTitle}>{entry.date}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecal accidents</Text>
                <Text style={styles.detailValue}>
                  {formatNumber(entry.fecal_accidents)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Urine accidents</Text>
                <Text style={styles.detailValue}>
                  {formatNumber(entry.urine_accidents)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Leaks</Text>
                <Text style={styles.detailValue}>{formatBoolean(entry.leaks)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>BM type</Text>
                <Text style={styles.detailValue}>{formatText(entry.bm_type)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>BM notes</Text>
                <Text style={styles.detailValue}>{formatText(entry.bm_notes)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Poop consistency</Text>
                <Text style={styles.detailValue}>
                  {formatPoopConsistency(entry.poop_consistency)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Meds/Protocol</Text>
                <Text style={styles.detailValue}>
                  {formatMedication(entry.medication)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medication amounts</Text>
                <Text style={styles.detailValue}>
                  {formatMedicationDoses(entry.medication_doses)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hydration/Diet</Text>
                <Text style={styles.detailValue}>
                  {formatMotilityFoods(entry.motility_foods)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Water</Text>
                <Text style={styles.detailValue}>
                  {entry.water_intake === null || entry.water_intake === undefined
                    ? "Not logged"
                    : `${entry.water_intake} ${entry.water_unit ?? ""}`}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fiber</Text>
                <Text style={styles.detailValue}>
                  {entry.fiber_intake === null || entry.fiber_intake === undefined
                    ? "Not logged"
                    : `${entry.fiber_intake} ${entry.fiber_unit ?? ""}`}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Clean out</Text>
                <Text style={styles.detailValue}>{formatBoolean(entry.clean_out)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Clean out notes</Text>
                <Text style={styles.detailValue}>{formatText(entry.clean_out_notes)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Timed sits completed</Text>
                <Text style={styles.detailValue}>
                  {formatBoolean(entry.timed_sits_completed)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Activity 30 min</Text>
                <Text style={styles.detailValue}>
                  {formatBoolean(entry.activity_30_min)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{formatText(entry.notes)}</Text>
              </View>
            </View>
          ))
        )}
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
  headerRow: {
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  exportRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  secondaryButton: {
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
    color: "#1E293B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  detailLabel: {
    color: "#64748B",
    fontSize: 13,
    flex: 1,
  },
  detailValue: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  status: {
    color: "#DC2626",
    fontWeight: "500",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyText: {
    color: "#64748B",
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 12,
  },
  dayCell: {
    alignItems: "center",
    paddingVertical: 6,
  },
  dayText: {
    fontSize: 12,
    color: "#0F172A",
  },
  dayTextDisabled: {
    color: "#CBD5F5",
  },
  dayTextSelected: {
    color: "#4C6FFF",
    fontWeight: "700",
  },
  markerRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  legendText: {
    fontSize: 11,
    color: "#475569",
  },
  selectedSection: {
    gap: 12,
  },
});