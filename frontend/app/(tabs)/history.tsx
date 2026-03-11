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

export default function HistoryScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

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

  const formatMedication = (value) => {
    if (value === null || value === undefined) return "Not logged";
    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "Not logged";
    }
    return value || "Not logged";
  };

  const formatMedicationExport = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      return value.join(" | ");
    }
    return value;
  };

  const buildCsv = () => {
    const header = [
      "Date",
      "Fecal accidents",
      "Urine accidents",
      "Leaks",
      "BM type",
      "BM notes",
      "Meds/Protocol",
      "Water intake",
      "Water unit",
      "Fiber intake",
      "Fiber unit",
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
      formatMedicationExport(entry.medication),
      entry.water_intake ?? "",
      entry.water_unit ?? "",
      entry.fiber_intake ?? "",
      entry.fiber_unit ?? "",
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
          <td>${formatMedicationExport(entry.medication)}</td>
          <td>${entry.water_intake ?? ""} ${entry.water_unit ?? ""}</td>
          <td>${entry.fiber_intake ?? ""} ${entry.fiber_unit ?? ""}</td>
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
                <th style="border: 1px solid #ccc; padding: 6px;">Meds/Protocol</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Water</th>
                <th style="border: 1px solid #ccc; padding: 6px;">Fiber</th>
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

        {loading ? <ActivityIndicator color="#4C6FFF" /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {!loading && entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No entries yet. Add a daily log to view history.
            </Text>
          </View>
        ) : null}

        {entries.map((entry) => (
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
              <Text style={styles.detailLabel}>Meds/Protocol</Text>
              <Text style={styles.detailValue}>
                {formatMedication(entry.medication)}
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
        ))}
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
});