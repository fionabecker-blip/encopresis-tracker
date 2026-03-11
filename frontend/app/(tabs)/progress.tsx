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
import { apiGet } from "../utils/api";
import { loadSettings } from "../utils/storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import SegmentedControl from "../components/SegmentedControl";

const chartHeight = 220;

const colors = {
  sp: "#2563EB",
  enema: "#F59E0B",
  leaks: "#EF4444",
  activity: "#10B981",
};

const viewOptions = [
  { label: "Daily", value: "daily" },
  { label: "Meds impact", value: "meds" },
];

const medsOptions = [
  { label: "Miralax/Restorolax/PEG", value: "Miralax/Restorolax/PEG" },
  { label: "Senna", value: "Senna" },
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

const normalizeMed = (value) => {
  if (!value) return "";
  const normalized = value.toLowerCase();
  if (
    normalized.includes("miralax") ||
    normalized.includes("restoralax") ||
    normalized.includes("restorolax") ||
    normalized.includes("peg")
  ) {
    return "miralax/restorolax/peg";
  }
  if (normalized.includes("senna") || normalized.includes("exlax")) {
    return "senna";
  }
  if (normalized.includes("multi-mop") || normalized.includes("multi mop")) {
    return "multi-mop";
  }
  if (normalized.includes("mop x") || normalized.includes("mopx")) {
    return "mop x";
  }
  if (normalized.includes("lgs")) {
    return "lgs";
  }
  if (normalized.includes("none")) {
    return "none/not taken";
  }
  return normalized;
};

const parseDateString = (value) => {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((item) => Number(item));
  return new Date(year, month - 1, day);
};

const formatDisplayDate = (date) => {
  if (!date) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatFullDate = (date) => {
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const BarChart = ({ labels, values, color }) => {
  const maxValue = Math.max(1, ...values);
  const chartHeight = 140;
  const barWidth = 24;
  const gap = 18;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.chartRow, { height: chartHeight + 30 }]}> 
        {values.map((value, index) => {
          const height = (value / maxValue) * chartHeight;
          return (
            <View key={`${labels[index]}-${index}`} style={styles.barGroup}> 
              <View style={[styles.bar, { height, backgroundColor: color, width: barWidth }]} />
              <Text style={styles.barValue}>{value}</Text>
              <Text style={styles.barLabelSmall}>{labels[index]}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const LineChart = ({ labels, values }) => {
  if (!values.length) {
    return <Text style={styles.emptyText}>Not enough stool intervals yet.</Text>;
  }
  const maxValue = Math.max(1, ...values);
  const chartHeight = 140;
  const width = Math.max(260, values.length * 60);
  const pointSpacing = values.length > 1 ? (width - 20) / (values.length - 1) : 0;

  const points = values.map((value, index) => {
    const x = 10 + index * pointSpacing;
    const y = chartHeight - (value / maxValue) * (chartHeight - 20) + 10;
    return { x, y, label: labels[index], value };
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.lineChart, { width, height: chartHeight + 40 }]}> 
        <View style={[styles.lineGrid, { top: 10 }]} />
        <View style={[styles.lineGrid, { top: chartHeight / 2 }]} />
        <View style={[styles.lineGrid, { top: chartHeight }]} />
        {points.slice(1).map((point, index) => {
          const prev = points[index];
          const dx = point.x - prev.x;
          const dy = point.y - prev.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          return (
            <View
              key={`line-${index}`}
              style={[
                styles.lineSegment,
                {
                  width: distance,
                  left: prev.x,
                  top: prev.y,
                  transform: [{ rotateZ: `${angle}rad` }],
                },
              ]}
            />
          );
        })}
        {points.map((point, index) => (
          <View key={`point-${index}`} style={[styles.linePoint, { left: point.x - 4, top: point.y - 4 }]} />
        ))}
        {points.map((point, index) => (
          <Text key={`label-${index}`} style={[styles.lineLabel, { left: point.x - 18, top: chartHeight + 12 }]}> 
            {point.label}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

export default function ProgressScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [chartMode, setChartMode] = useState("daily");
  const [childName, setChildName] = useState("");

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

  useEffect(() => {
    loadSettings().then((settings) => {
      setChildName(settings.childName || "");
    });
  }, []);

  const dailyMetrics = entries.map((entry) => {
    const bmType = normalizeBmType(entry.bm_type);
    const sp = bmType.includes("sp") ? 1 : 0;
    const enema = bmType.includes("enema") ? 1 : 0;
    const leaks = entry.leaks ? 1 : 0;
    const activity = entry.activity_30_min ? 1 : 0;
    const total = sp + enema + leaks + activity;
    return {
      date: entry.date,
      sp,
      enema,
      leaks,
      activity,
      total,
    };
  });

  const medsMetrics = medsOptions.map((option) => {
    const related = entries.filter((entry) => {
      const meds = getMedList(entry.medication).map(normalizeMed);
      return meds.includes(normalizeMed(option.value));
    });
    const leaks = related.filter((entry) => entry.leaks).length;
    const sp = related.filter((entry) =>
      normalizeBmType(entry.bm_type).includes("sp")
    ).length;
    const enema = related.filter((entry) =>
      normalizeBmType(entry.bm_type).includes("enema")
    ).length;
    const activity = related.filter((entry) => entry.activity_30_min).length;
    const total = leaks + sp + enema + activity;
    return {
      label: option.label,
      sp,
      enema,
      leaks,
      activity,
      total,
    };
  });

  const activeMetrics = chartMode === "daily" ? dailyMetrics : medsMetrics;
  const maxTotal = Math.max(1, ...activeMetrics.map((item) => item.total));
  const labelStep = Math.max(1, Math.ceil(dailyMetrics.length / 12));
  const isMedsMode = chartMode === "meds";

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 29);
  const rangeDates = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });

  const entriesInRange = entries.filter((entry) => {
    const parsed = parseDateString(entry.date);
    if (!parsed) return false;
    return parsed >= startDate && parsed <= today;
  });

  const entryMap = new Map(entriesInRange.map((entry) => [entry.date, entry]));

  const getAccidents = (entry) => {
    if (!entry) return 0;
    const fecal = entry.fecal_accidents || 0;
    const urine = entry.urine_accidents || 0;
    const leaks = entry.leaks ? 1 : 0;
    return fecal + urine + leaks;
  };

  const stoolEvents = entriesInRange.filter((entry) => {
    const bmType = normalizeBmType(entry.bm_type);
    return bmType.includes("sp") || bmType.includes("enema");
  });

  const stoolDates = stoolEvents
    .map((entry) => parseDateString(entry.date))
    .filter(Boolean)
    .sort((a, b) => a - b);

  const totalBowelMovements = stoolEvents.length;
  const totalAccidents = entriesInRange.reduce(
    (sum, entry) => sum + getAccidents(entry),
    0
  );

  let currentStreak = 0;
  let longestStreak = 0;
  rangeDates.forEach((date) => {
    const key = date.toISOString().split("T")[0];
    const entry = entryMap.get(key);
    if (entry && getAccidents(entry) === 0) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const stoolIntervals = [];
  for (let i = 1; i < stoolDates.length; i += 1) {
    const diff = (stoolDates[i] - stoolDates[i - 1]) / (1000 * 60 * 60 * 24);
    stoolIntervals.push(diff);
  }
  const averageInterval = stoolIntervals.length
    ? stoolIntervals.reduce((sum, value) => sum + value, 0) / stoolIntervals.length
    : null;

  const expectedDays = entriesInRange.length;
  const completedDays = entriesInRange.filter((entry) => {
    const meds = getMedList(entry.medication);
    if (!meds.length) return false;
    return !meds.some((item) =>
      normalizeMed(item).includes("none/not taken")
    );
  }).length;
  const adherencePercent = expectedDays
    ? Math.round((completedDays / expectedDays) * 100)
    : null;

  const weeksCount = Math.ceil(rangeDates.length / 7);
  const accidentsPerWeek = new Array(weeksCount).fill(0);
  const bmsPerWeek = new Array(weeksCount).fill(0);

  entriesInRange.forEach((entry) => {
    const parsed = parseDateString(entry.date);
    if (!parsed) return;
    const weekIndex = Math.floor(
      (parsed - startDate) / (1000 * 60 * 60 * 24 * 7)
    );
    if (weekIndex < 0 || weekIndex >= weeksCount) return;
    accidentsPerWeek[weekIndex] += getAccidents(entry);
    const bmType = normalizeBmType(entry.bm_type);
    if (bmType.includes("sp") || bmType.includes("enema")) {
      bmsPerWeek[weekIndex] += 1;
    }
  });

  const weekLabels = accidentsPerWeek.map((_, index) => `Week ${index + 1}`);

  const intervalData = stoolDates.slice(1).map((date, index) => {
    return {
      label: formatDisplayDate(date),
      value: stoolIntervals[index] || 0,
    };
  });

  let accidentsWhenLongInterval = 0;
  let accidentsObserved = 0;
  let lastStoolDate = null;
  rangeDates.forEach((date) => {
    const key = date.toISOString().split("T")[0];
    const entry = entryMap.get(key);
    const bmType = entry ? normalizeBmType(entry.bm_type) : "";
    if (bmType.includes("sp") || bmType.includes("enema")) {
      lastStoolDate = date;
    }
    if (entry) {
      const accidents = getAccidents(entry);
      if (accidents > 0) {
        accidentsObserved += 1;
        if (lastStoolDate) {
          const diffDays = (date - lastStoolDate) / (1000 * 60 * 60 * 24);
          if (diffDays > 3) {
            accidentsWhenLongInterval += 1;
          }
        }
      }
    }
  });

  const patterns = [];
  if (accidentsObserved && accidentsWhenLongInterval / accidentsObserved >= 0.5) {
    patterns.push("Accidents occur when stool interval exceeds 3 days.");
  }
  if (!patterns.length) {
    patterns.push("No strong patterns detected yet. Keep logging for clearer trends.");
  }

  const reportStart = formatFullDate(startDate);
  const reportEnd = formatFullDate(today);
  const reportChildName = childName || "Child";

  const buildBarsHtml = (labels, values, color) => {
    const maxValue = Math.max(1, ...values);
    return `
      <div style="display:flex; align-items:flex-end; gap:12px; height:120px; margin-top:8px;">
        ${values
          .map((value, index) => {
            const height = (value / maxValue) * 100;
            return `
              <div style="display:flex; flex-direction:column; align-items:center; font-size:10px;">
                <div style="width:20px; height:${height}px; background:${color}; border-radius:4px;"></div>
                <div style="margin-top:4px; font-weight:600;">${value}</div>
                <div>${labels[index]}</div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  };

  const buildLineHtml = (labels, values) => {
    if (!values.length) {
      return `<div style="font-size:12px; color:#64748B;">Not enough stool intervals yet.</div>`;
    }
    const width = 320;
    const height = 120;
    const maxValue = Math.max(1, ...values);
    const step = values.length > 1 ? (width - 40) / (values.length - 1) : 0;
    const points = values
      .map((value, index) => {
        const x = 20 + index * step;
        const y = height - (value / maxValue) * (height - 20) + 10;
        return `${x},${y}`;
      })
      .join(" ");
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <polyline points="${points}" fill="none" stroke="#4C6FFF" stroke-width="2" />
        ${values
          .map((value, index) => {
            const x = 20 + index * step;
            const y = height - (value / maxValue) * (height - 20) + 10;
            return `<circle cx="${x}" cy="${y}" r="3" fill="#4C6FFF" />`;
          })
          .join("")}
      </svg>
      <div style="display:flex; gap:12px; font-size:10px; margin-top:4px; color:#64748B;">
        ${labels.map((label) => `<span>${label}</span>`).join("")}
      </div>
    `;
  };

  const buildReportHtml = () => {
    return `
      <html>
        <body style="font-family: Helvetica, Arial; padding: 24px; color:#0F172A;">
          <h2>Pediatrician Report</h2>
          <p><strong>Child name:</strong> ${reportChildName}</p>
          <p><strong>Date range:</strong> ${reportStart} - ${reportEnd}</p>

          <h3>Summary</h3>
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <tr>
              <td style="border:1px solid #E2E8F0; padding:8px;">Total bowel movements</td>
              <td style="border:1px solid #E2E8F0; padding:8px; font-weight:600;">${totalBowelMovements}</td>
              <td style="border:1px solid #E2E8F0; padding:8px;">Total accidents</td>
              <td style="border:1px solid #E2E8F0; padding:8px; font-weight:600;">${totalAccidents}</td>
            </tr>
            <tr>
              <td style="border:1px solid #E2E8F0; padding:8px;">Longest accident-free streak</td>
              <td style="border:1px solid #E2E8F0; padding:8px; font-weight:600;">${longestStreak} days</td>
              <td style="border:1px solid #E2E8F0; padding:8px;">Medication adherence</td>
              <td style="border:1px solid #E2E8F0; padding:8px; font-weight:600;">${adherencePercent === null ? "N/A" : `${adherencePercent}%`}</td>
            </tr>
            <tr>
              <td style="border:1px solid #E2E8F0; padding:8px;">Avg days between stools</td>
              <td style="border:1px solid #E2E8F0; padding:8px; font-weight:600;" colspan="3">${averageInterval === null ? "N/A" : averageInterval.toFixed(1)}</td>
            </tr>
          </table>

          <h3>Accidents per week</h3>
          ${buildBarsHtml(weekLabels, accidentsPerWeek, "#EF4444")}

          <h3>Bowel movements per week</h3>
          ${buildBarsHtml(weekLabels, bmsPerWeek, "#2563EB")}

          <h3>Stool interval trend (days between stools)</h3>
          ${buildLineHtml(intervalData.map((item) => item.label), intervalData.map((item) => item.value))}

          <h3>Detected patterns</h3>
          <ul>
            ${patterns.map((pattern) => `<li>${pattern}</li>`).join("")}
          </ul>
        </body>
      </html>
    `;
  };

  const handleExportReport = async () => {
    if (!entriesInRange.length) {
      setStatus("Add entries to generate a report.");
      return;
    }
    try {
      const html = buildReportHtml();
      const file = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(file.uri, { dialogTitle: "Share pediatrician report" });
    } catch (error) {
      setStatus("Unable to export report.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Progress overview</Text>
        <Text style={styles.subtitle}>
          Track daily outcomes or compare meds/protocol impact with activity.
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
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.activity }]} />
              <Text style={styles.legendLabel}>Activity</Text>
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
                    const activityHeight = (item.activity / maxTotal) * chartHeight;
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
                          {item.activity ? (
                            <View
                              style={[
                                styles.barSegment,
                                { height: activityHeight, backgroundColor: colors.activity },
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
                            L{item.leaks} | S{item.sp} | E{item.enema} | A{item.activity}
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

        <View style={styles.reportCard}>
          <View style={styles.reportHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Pediatrician report (last 30 days)</Text>
              <Text style={styles.reportMeta}>
                {reportChildName} · {reportStart} - {reportEnd}
              </Text>
            </View>
            <TouchableOpacity style={styles.reportButton} onPress={handleExportReport}>
              <Text style={styles.reportButtonText}>Export report</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total bowel movements</Text>
              <Text style={styles.summaryValue}>{totalBowelMovements}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total accidents</Text>
              <Text style={styles.summaryValue}>{totalAccidents}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Longest accident-free streak</Text>
              <Text style={styles.summaryValue}>{longestStreak} days</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Medication adherence</Text>
              <Text style={styles.summaryValue}>
                {adherencePercent === null ? "N/A" : `${adherencePercent}%`}
              </Text>
            </View>
            <View style={styles.summaryCardFull}>
              <Text style={styles.summaryLabel}>Average days between stools</Text>
              <Text style={styles.summaryValue}>
                {averageInterval === null ? "N/A" : averageInterval.toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Accidents per week</Text>
            <BarChart labels={weekLabels} values={accidentsPerWeek} color="#EF4444" />
          </View>

          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Bowel movements per week</Text>
            <BarChart labels={weekLabels} values={bmsPerWeek} color="#2563EB" />
          </View>

          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Stool interval trend</Text>
            <LineChart
              labels={intervalData.map((item) => item.label)}
              values={intervalData.map((item) => item.value)}
            />
          </View>

          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Detected patterns</Text>
            {patterns.map((pattern) => (
              <Text key={pattern} style={styles.patternText}>
                • {pattern}
              </Text>
            ))}
          </View>
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
  barGroup: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    justifyContent: "flex-end",
  },
  bar: {
    borderRadius: 6,
  },
  barValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
  },
  barLabelSmall: {
    fontSize: 10,
    color: "#64748B",
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
  reportCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 16,
  },
  reportHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  reportMeta: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },
  reportButton: {
    backgroundColor: "#4C6FFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  reportButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flexBasis: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  summaryCardFull: {
    flexBasis: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 11,
  },
  summaryValue: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  reportSection: {
    gap: 8,
  },
  patternText: {
    color: "#1E293B",
    fontSize: 13,
    lineHeight: 18,
  },
  lineChart: {
    position: "relative",
    paddingTop: 10,
  },
  lineGrid: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  lineSegment: {
    position: "absolute",
    height: 2,
    backgroundColor: "#4C6FFF",
  },
  linePoint: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4C6FFF",
  },
  lineLabel: {
    position: "absolute",
    fontSize: 10,
    color: "#64748B",
    width: 50,
    textAlign: "center",
  },
});