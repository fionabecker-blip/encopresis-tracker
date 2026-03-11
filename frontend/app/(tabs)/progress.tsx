import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiGet } from "../utils/api";
import SegmentedControl from "../components/SegmentedControl";

const chartHeight = 220;

const colors = {
  sp: "#2563EB",
  enema: "#F59E0B",
  leaks: "#EF4444",
};

const viewOptions = [
  { label: "Daily", value: "daily" },
  { label: "Meds impact", value: "meds" },
];

const medsOptions = [
  { label: "Miralax/Restoralax/PEG", value: "Miralax/Restoralax/PEG" },
  { label: "Senna/Exlax", value: "Senna/Exlax" },
  { label: "LGS", value: "LGS" },
  { label: "Multi-Mop", value: "Multi-Mop" },
  { label: "MOP x", value: "MOP x" },
  { label: "None/Not taken", value: "None/Not taken" },
];

const normalizeBmType = (value) => {
  if (!value) return "";
  return value.toLowerCase();
};

const formatLabel = (dateValue) => {
  if (!dateValue) return "";
  const parts = dateValue.split("-");
  if (parts.length !== 3) return dateValue;
  return `${parts[1]}/${parts[2]}`;
};

const getMedList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

export default function ProgressScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [chartMode, setChartMode] = useState("daily");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setStatus("");
    try {
      const data = await apiGet("/entries");
      const sorted = [...data].sort((a, b) =>
        (a.date || "").localeCompare(b.date || "")
      );
      setEntries(sorted);
    } catch (error) {
      setStatus("Could not load progress data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const dailyMetrics = entries.map((entry) => {
    const bmType = normalizeBmType(entry.bm_type);
    const sp = bmType.includes("sp") ? 1 : 0;
    const enema = bmType.includes("enema") ? 1 : 0;
    const leaks = entry.leaks ? 1 : 0;
    const total = sp + enema + leaks;
    return {
      date: entry.date,
      sp,
      enema,
      leaks,
      total,
    };
  });

  const medsMetrics = medsOptions.map((option) => {
    const related = entries.filter((entry) => {
      const meds = getMedList(entry.medication);
      return meds.includes(option.value);
    });
    const leaks = related.filter((entry) => entry.leaks).length;
    const sp = related.filter((entry) =>
      normalizeBmType(entry.bm_type).includes("sp")
    ).length;
    const enema = related.filter((entry) =>
      normalizeBmType(entry.bm_type).includes("enema")
    ).length;
    const total = leaks + sp + enema;
    return {
      label: option.label,
      sp,
      enema,
      leaks,
      total,
    };
  });

  const activeMetrics = chartMode === "daily" ? dailyMetrics : medsMetrics;
  const maxTotal = Math.max(1, ...activeMetrics.map((item) => item.total));
  const labelStep = Math.max(1, Math.ceil(dailyMetrics.length / 12));
  const isMedsMode = chartMode === "meds";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Progress overview</Text>
        <Text style={styles.subtitle}>
          Track daily outcomes or compare meds/protocol impact over time.
        </Text>

        <SegmentedControl options={viewOptions} value={chartMode} onChange={setChartMode} />

        {loading ? <ActivityIndicator color="#4C6FFF" /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {!loading && activeMetrics.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Add daily logs to see progress here.</Text>
          </View>
        ) : null}

        {activeMetrics.length > 0 ? (
          <View style={styles.chartCard}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: colors.sp }]} />
                <Text style={styles.legendLabel}>SP</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: colors.enema }]} />
                <Text style={styles.legendLabel}>Enema</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: colors.leaks }]} />
                <Text style={styles.legendLabel}>Leaks</Text>
              </View>
            </View>

            <View style={styles.chartWrapper}>
              <View style={[styles.gridLine, { top: 0 }]} />
              <View style={[styles.gridLine, { top: chartHeight * 0.33 }]} />
              <View style={[styles.gridLine, { top: chartHeight * 0.66 }]} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chartRow}>
                  {activeMetrics.map((item, index) => {
                    const spHeight = (item.sp / maxTotal) * chartHeight;
                    const enemaHeight = (item.enema / maxTotal) * chartHeight;
                    const leaksHeight = (item.leaks / maxTotal) * chartHeight;
                    const showLabel = isMedsMode ? true : index % labelStep === 0;
                    return (
                      <View
                        key={`${item.date || item.label}-${index}`}
                        style={[styles.barColumn, isMedsMode && styles.barColumnWide]}
                      >
                        <View style={[styles.barStack, isMedsMode && styles.barStackWide]}>
                          {item.leaks ? (
                            <View
                              style={[
                                styles.barSegment,
                                { height: leaksHeight, backgroundColor: colors.leaks },
                              ]}
                            />
                          ) : null}
                          {item.enema ? (
                            <View
                              style={[
                                styles.barSegment,
                                { height: enemaHeight, backgroundColor: colors.enema },
                              ]}
                            />
                          ) : null}
                          {item.sp ? (
                            <View
                              style={[
                                styles.barSegment,
                                { height: spHeight, backgroundColor: colors.sp },
                              ]}
                            />
                          ) : null}
                        </View>
                        <Text style={styles.barLabel} numberOfLines={2}>
                          {showLabel
                            ? isMedsMode
                              ? item.label
                              : formatLabel(item.date)
                            : ""}
                        </Text>
                        {isMedsMode ? (
                          <Text style={styles.countLabel}>
                            L{item.leaks} | S{item.sp} | E{item.enema}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        ) : null}
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
  chartCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendLabel: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "600",
  },
  chartWrapper: {
    height: chartHeight + 30,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  chartRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 6,
    paddingBottom: 8,
  },
  barColumn: {
    width: 22,
    alignItems: "center",
  },
  barColumnWide: {
    width: 92,
  },
  barStack: {
    width: 16,
    height: chartHeight,
    justifyContent: "flex-end",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  barStackWide: {
    width: 28,
  },
  barSegment: {
    width: "100%",
  },
  barLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 4,
    minHeight: 12,
    textAlign: "center",
  },
  countLabel: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
    textAlign: "center",
  },
});