import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadEntries, loadSettings } from "../utils/storage";
import type { Entry } from "../types";
import { useTheme } from "../../src/theme/useTheme";
import { type Theme } from "../../src/theme/tokens";
// The exported PDF is its own document, not a screenshot of the app: white
// stock, no icons, and never the device color scheme. See reportTemplate.
import {
  loadReportFontCss,
  renderBarChart,
  renderLineChart,
  renderReportDocument,
} from "../../src/report/reportTemplate";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

// Escape user-entered text before interpolating it into export HTML, so
// names containing <, >, & can't inject markup into the generated PDF.
const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Filesystem-safe slug for child name, e.g. "Alex K." -> "alex-k".
const slugify = (value: string) => {
  const trimmed = (value || "").trim().toLowerCase();
  if (!trimmed) return "child";
  return trimmed
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "child";
};
import SegmentedControl from "../components/SegmentedControl";
import Card, { CardTitle } from "../../src/components/Card";
import PrimaryButton from "../../src/components/PrimaryButton";
import ScreenHeader from "../../src/components/ScreenHeader";
import EmptyState from "../../src/components/EmptyState";

const chartHeight = 220;

// Semantic chart colors. `leaks` and `accidents` deliberately resolve to the
// same color — clinically they are two symptoms of the same problem.
const makeChartColors = (t: Theme) => ({
  sp: t.data.chart.spontaneous,
  enema: t.data.chart.enema,
  leaks: t.data.chart.leaks,
});

const viewOptions = [
  { label: "Daily", value: "daily" },
  { label: "Meds impact", value: "meds" },
];

const medsOptions = [
  { label: "Miralax/Restorolax/PEG", value: "Miralax/Restorolax/PEG" },
  { label: "Senna/Exlax", value: "Senna/Exlax" },
  { label: "LGS", value: "LGS" },
  { label: "Multi-Mop", value: "Multi-Mop" },
  { label: "MOP x", value: "MOP x" },
  { label: "Mag citrate", value: "Mag citrate" },
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
    return "senna/exlax";
  }
  if (normalized.includes("multi-mop") || normalized.includes("multi mop")) {
    return "multi-mop";
  }
  if (normalized.includes("mop x") || normalized.includes("mopx")) {
    return "mop x";
  }
  if (normalized.includes("mag citrate")) {
    return "mag citrate";
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const colors = useMemo(() => makeChartColors(theme), [theme]);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [chartMode, setChartMode] = useState("daily");
  const [childName, setChildName] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setStatus("");
    try {
      const data = await loadEntries();
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

  // Three series only: leaks/accidents, spontaneous, and suppository-induced.
  // Activity is still captured in the daily log, it just isn't a bowel outcome,
  // so charting it alongside these inflated `total` and shrank the bars that matter.
  const dailyMetrics = entries.map((entry) => {
    const bmType = normalizeBmType(entry.bm_type);
    const sp = bmType.includes("sp") ? 1 : 0;
    const enema = bmType.includes("enema") ? 1 : 0;
    const leaks =
      (entry.fecal_accidents || 0) +
      (entry.fecal_leaks || 0) +
      (entry.urine_accidents || 0) +
      (entry.urine_leaks || 0);
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
      const meds = getMedList(entry.medication).map(normalizeMed);
      return meds.includes(normalizeMed(option.value));
    });
    const leaks = related.reduce(
      (sum, entry) =>
        sum +
        (entry.fecal_accidents || 0) +
        (entry.fecal_leaks || 0) +
        (entry.urine_accidents || 0) +
        (entry.urine_leaks || 0),
      0
    );
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
    return (
      (entry.fecal_accidents || 0) +
      (entry.fecal_leaks || 0) +
      (entry.urine_accidents || 0) +
      (entry.urine_leaks || 0)
    );
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

  // Longest accident-free streak within the 30-day range.
  let longestStreak = 0;
  {
    let run = 0;
    rangeDates.forEach((date) => {
      const key = date.toISOString().split("T")[0];
      const entry = entryMap.get(key);
      if (entry && getAccidents(entry) === 0) {
        run += 1;
        longestStreak = Math.max(longestStreak, run);
      } else {
        run = 0;
      }
    });
  }

  // Current streaks count backwards from today. Days without an entry break the streak,
  // so this rewards consistent logging as well as accident-free days.
  const countCurrentStreak = (predicate: (entry: any) => boolean) => {
    let count = 0;
    for (let i = rangeDates.length - 1; i >= 0; i -= 1) {
      const key = rangeDates[i].toISOString().split("T")[0];
      const entry = entryMap.get(key);
      if (entry && predicate(entry)) {
        count += 1;
      } else {
        break;
      }
    }
    return count;
  };

  const currentAccidentFreeStreak = countCurrentStreak(
    (entry) => getAccidents(entry) === 0
  );
  const currentLoggingStreak = countCurrentStreak(() => true);
  const currentTimedSitsStreak = countCurrentStreak(
    (entry) => entry.timed_sits_completed === true
  );

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

  const timedSitsDays = entriesInRange.filter(
    (entry) => entry.timed_sits_completed
  ).length;

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

  // ----- Streaks & Weeks: weekly clean-day view -----
  // "Clean" = no fecal/urine accidents and no leaks/smears that day.
  // The thin second track (% days with a BM) catches the risky pattern of
  // "clean but not pooping" that often precedes a blowout.
  const DAY_MS = 1000 * 60 * 60 * 24;
  const weeklyStats = Array.from({ length: weeksCount }, (_, index) => {
    const weekStart = new Date(startDate.getTime() + index * 7 * DAY_MS);
    const weekEnd = new Date(
      Math.min(weekStart.getTime() + 6 * DAY_MS, today.getTime())
    );
    return {
      weekStart,
      weekEnd,
      logged: 0,
      clean: 0,
      bm: 0,
      meds: new Set<string>(),
      activities: new Set<string>(),
    };
  });

  rangeDates.forEach((date) => {
    const weekIndex = Math.min(
      weeksCount - 1,
      Math.floor((date.getTime() - startDate.getTime()) / (7 * DAY_MS))
    );
    const stats = weeklyStats[weekIndex];
    const entry = entryMap.get(date.toISOString().split("T")[0]);
    if (!entry || !stats) return;
    stats.logged += 1;
    if (getAccidents(entry) === 0) stats.clean += 1;
    const bmType = normalizeBmType(entry.bm_type);
    if (bmType.includes("sp") || bmType.includes("enema")) stats.bm += 1;
    getMedList(entry.medication).forEach((med) => {
      const normalized = normalizeMed(med);
      if (normalized && !normalized.includes("none")) stats.meds.add(String(med));
    });
    (entry.activity_types || []).forEach((activity) =>
      stats.activities.add(String(activity))
    );
  });

  const weeklyView = weeklyStats.map((stats, index) => {
    const cleanPct = stats.logged ? stats.clean / stats.logged : 0;
    const bmPct = stats.logged ? stats.bm / stats.logged : 0;
    const prev = index > 0 ? weeklyStats[index - 1] : null;
    const prevCleanPct = prev && prev.logged ? prev.clean / prev.logged : null;

    // "What changed is good": only surface a note when this week meaningfully
    // improved on the last one and both weeks have enough data to compare.
    let changeNote = "";
    if (
      prev &&
      prev.logged >= 3 &&
      stats.logged >= 3 &&
      prevCleanPct !== null &&
      cleanPct - prevCleanPct >= 0.15
    ) {
      const newMeds = [...stats.meds].filter((med) => !prev.meds.has(med));
      const newActivities = [...stats.activities].filter(
        (activity) => !prev.activities.has(activity)
      );
      const additions = [...newMeds, ...newActivities];
      changeNote = additions.length
        ? `Better week \u2014 new this week: ${additions.join(", ")}`
        : "Better week on the same routine \u2014 it\u2019s working. Keep going.";
    }

    return {
      key: `week-${index}`,
      label: `${formatDisplayDate(stats.weekStart)}\u2013${formatDisplayDate(stats.weekEnd)}`,
      logged: stats.logged,
      clean: stats.clean,
      bm: stats.bm,
      cleanPct,
      bmPct,
      changeNote,
    };
  });
  const hasWeeklyData = weeklyView.some((week) => week.logged > 0);

  const intervalData = stoolDates.slice(1).map((date, index) => {
    return {
      date,
      label: formatDisplayDate(date),
      value: stoolIntervals[index] || 0,
    };
  });

  // ----- Report milestones -----
  // The only events that earn an apricot marker in the exported charts. Kept
  // deliberately narrow: a clinician should read apricot as "something changed
  // here", not as generic emphasis.
  const milestoneDates: { date: Date; label: string }[] = [];

  const firstSpontaneous = rangeDates.find((date) => {
    const entry = entryMap.get(date.toISOString().split("T")[0]);
    return entry ? normalizeBmType(entry.bm_type).includes("sp") : false;
  });
  if (firstSpontaneous) {
    milestoneDates.push({
      date: firstSpontaneous,
      label: `first spontaneous BM ${formatDisplayDate(firstSpontaneous)}`,
    });
  }

  // A "med change" is the medication set differing from the previous logged
  // day. The first logged day establishes the baseline and is not a change.
  let previousMeds: string | null = null;
  rangeDates.forEach((date) => {
    const entry = entryMap.get(date.toISOString().split("T")[0]);
    if (!entry) return;
    const meds = getMedList(entry.medication)
      .map((med) => normalizeMed(med))
      .filter((med) => med && !med.includes("none"))
      .sort()
      .join("|");
    if (previousMeds !== null && meds !== previousMeds) {
      milestoneDates.push({
        date,
        label: `med change ${formatDisplayDate(date)}`,
      });
    }
    previousMeds = meds;
  });

  /** Milestone note printed under a chart, or "" when there are none to mark. */
  const milestoneNote = (indices: Set<number>, labels: string[]) =>
    indices.size ? `Apricot marks: ${labels.join("; ")}.` : "";

  const milestoneWeeks = new Set<number>();
  const milestoneWeekLabels: string[] = [];
  milestoneDates.forEach(({ date, label }) => {
    const weekIndex = Math.floor(
      (date.getTime() - startDate.getTime()) / (7 * DAY_MS)
    );
    if (weekIndex < 0 || weekIndex >= weeksCount) return;
    milestoneWeeks.add(weekIndex);
    milestoneWeekLabels.push(label);
  });

  const milestoneIntervals = new Set<number>();
  const milestoneIntervalLabels: string[] = [];
  milestoneDates.forEach(({ date, label }) => {
    const key = date.toISOString().split("T")[0];
    const index = intervalData.findIndex(
      (item) => item.date.toISOString().split("T")[0] === key
    );
    if (index === -1) return;
    milestoneIntervals.add(index);
    milestoneIntervalLabels.push(label);
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

  const supportMessages = {
    improvement: [
      "Fewer accidents this week. That’s a good sign the routine is helping.",
      "Small improvements matter. This week shows progress—keep going.",
      "Accidents are down. Gradual change is common in encopresis recovery.",
    ],
    noChange: [
      "Progress can be slow. Consistency with sits and meds still matters.",
      "No change yet is common. Staying steady often leads to improvement.",
      "Recovery can take months. Your routine now supports future progress.",
    ],
    setback: [
      "Setbacks happen. Keep the routine steady and give it time.",
      "A tougher week can still be part of progress. Consistency helps.",
      "Ups and downs are normal. Stay the course with the plan.",
    ],
    compliance: [
      "Great consistency this week. Regular sits and meds support recovery.",
      "Your routine is strong. That consistency often leads to progress.",
      "Nice follow-through. Steady routines help the body adjust.",
    ],
    streak: [
      "Several accident-free days is encouraging. Keep supporting the routine.",
      "A streak like this is a positive sign. Nice progress.",
      "Accident-free days are meaningful. Stay consistent.",
    ],
    logging: [
      "Thanks for tracking—your logs help reveal progress and patterns.",
      "Tracking consistently builds a clear picture over time.",
      "Your daily entries make patterns easier to spot.",
    ],
    validation: [
      "Encopresis can be hard on families. Staying engaged helps your child.",
      "You’re doing something important by sticking with the routine.",
      "This is challenging, and your steady support makes a difference.",
    ],
  };

  const last7Dates = rangeDates.slice(-7);
  const previous7Dates = rangeDates.slice(-14, -7);
  const last7Entries = last7Dates
    .map((date) => entryMap.get(date.toISOString().split("T")[0]))
    .filter(Boolean);
  const prev7Entries = previous7Dates
    .map((date) => entryMap.get(date.toISOString().split("T")[0]))
    .filter(Boolean);

  const last7Accidents = last7Entries.reduce(
    (sum, entry) => sum + getAccidents(entry),
    0
  );
  const prev7Accidents = prev7Entries.reduce(
    (sum, entry) => sum + getAccidents(entry),
    0
  );
  const sumLeaks = (list) =>
    list.reduce(
      (sum, entry) => sum + (entry.fecal_leaks || 0) + (entry.urine_leaks || 0),
      0
    );
  const last7Leaks = sumLeaks(last7Entries);
  const prev7Leaks = sumLeaks(prev7Entries);
  const last7LoggedDays = last7Entries.length;

  const medsLoggedDays = last7Entries.filter((entry) => {
    const meds = getMedList(entry.medication);
    if (!meds.length) return false;
    return !meds.some((item) => normalizeMed(item).includes("none/not taken"));
  }).length;

  let streakCount = 0;
  let bestStreak = 0;
  last7Dates.forEach((date) => {
    const entry = entryMap.get(date.toISOString().split("T")[0]);
    if (entry && getAccidents(entry) === 0) {
      streakCount += 1;
      bestStreak = Math.max(bestStreak, streakCount);
    } else {
      streakCount = 0;
    }
  });

  const accidentsChange = prev7Accidents ? (last7Accidents - prev7Accidents) / prev7Accidents : 0;
  const improvementDetected = last7Accidents < prev7Accidents && last7Leaks < prev7Leaks;
  const setbackDetected = last7Accidents > prev7Accidents && last7Leaks >= prev7Leaks;
  const noChangeDetected = Math.abs(accidentsChange) <= 0.1;
  const complianceDetected = last7LoggedDays >= 5 && medsLoggedDays >= 5;
  const loggingDetected = last7LoggedDays >= 5;

  const chooseMessage = (list, seed) => list[seed % list.length];
  const messageSeed = totalAccidents + totalBowelMovements + last7Accidents;

  let supportiveMessage = "";
  if (last7LoggedDays >= 7) {
    if (bestStreak >= 3) {
      supportiveMessage = chooseMessage(supportMessages.streak, messageSeed);
    } else if (improvementDetected) {
      supportiveMessage = chooseMessage(supportMessages.improvement, messageSeed);
    } else if (setbackDetected) {
      supportiveMessage = chooseMessage(supportMessages.setback, messageSeed);
    } else if (noChangeDetected) {
      supportiveMessage = chooseMessage(supportMessages.noChange, messageSeed);
    } else if (complianceDetected) {
      supportiveMessage = chooseMessage(supportMessages.compliance, messageSeed);
    } else if (loggingDetected) {
      supportiveMessage = chooseMessage(supportMessages.logging, messageSeed);
    } else {
      supportiveMessage = chooseMessage(supportMessages.validation, messageSeed);
    }
  }

  const buildReportHtml = (fontCss: string) => {
    const summaryRow = (label: string, value: string) => `
      <tr><td>${label}</td><td class="num">${value}</td></tr>`;

    const summaryPage = `
      <h2>Summary</h2>
      <table>
        <tbody>
          ${summaryRow("Total bowel movements", String(totalBowelMovements))}
          ${summaryRow("Total accidents", String(totalAccidents))}
          ${summaryRow("Current accident-free streak", `${currentAccidentFreeStreak} days`)}
          ${summaryRow("Longest accident-free streak", `${longestStreak} days`)}
          ${summaryRow("Medication adherence", adherencePercent === null ? "N/A" : `${adherencePercent}%`)}
          ${summaryRow("Current timed-sits streak", `${currentTimedSitsStreak} days`)}
          ${summaryRow("Avg days between stools", averageInterval === null ? "N/A" : averageInterval.toFixed(1))}
          ${summaryRow("Timed sits completed (days)", String(timedSitsDays))}
        </tbody>
      </table>

      <h2>Detected patterns</h2>
      <ul class="plain">
        ${patterns.map((pattern) => `<li>${esc(pattern)}</li>`).join("")}
      </ul>`;

    const chartsPage = `
      <h2>Accidents per week</h2>
      ${renderBarChart({
        labels: weekLabels,
        values: accidentsPerWeek,
        milestones: milestoneWeeks,
        note: milestoneNote(milestoneWeeks, milestoneWeekLabels),
      })}

      <h2>Bowel movements per week</h2>
      ${renderBarChart({
        labels: weekLabels,
        values: bmsPerWeek,
        milestones: milestoneWeeks,
        note: milestoneNote(milestoneWeeks, milestoneWeekLabels),
      })}

      <h2>Stool interval trend (days between stools)</h2>
      ${renderLineChart({
        labels: intervalData.map((item) => item.label),
        values: intervalData.map((item) => item.value),
        milestones: milestoneIntervals,
        note: milestoneNote(milestoneIntervals, milestoneIntervalLabels),
      })}`;

    return renderReportDocument({
      fontCss,
      patient: reportChildName,
      range: `${reportStart} \u2013 ${reportEnd}`,
      pages: [summaryPage, chartsPage],
    });
  };

  const handleExportReport = async () => {
    if (!entriesInRange.length) {
      setStatus("Add entries to generate a report.");
      return;
    }
    try {
      const fontCss = await loadReportFontCss();
      const html = buildReportHtml(fontCss);
      const file = await Print.printToFileAsync({ html });
      const startKey = startDate.toISOString().split("T")[0];
      const endKey = today.toISOString().split("T")[0];
      const fileName = `pediatrician-report-${slugify(childName)}-${startKey}-to-${endKey}.pdf`;
      // Use cacheDirectory (not documentDirectory) so health data doesn't
      // persist in iCloud-backed storage; files are deleted after sharing.
      const namedUri = `${FileSystem.cacheDirectory}${fileName}`;
      try {
        try {
          await FileSystem.deleteAsync(namedUri, { idempotent: true });
          await FileSystem.moveAsync({ from: file.uri, to: namedUri });
        } catch {
          await Sharing.shareAsync(file.uri, { dialogTitle: "Share pediatrician report" });
          return;
        }
        await Sharing.shareAsync(namedUri, {
          mimeType: "application/pdf",
          dialogTitle: "Share pediatrician report",
          UTI: "com.adobe.pdf",
        });
      } finally {
        await FileSystem.deleteAsync(namedUri, { idempotent: true });
        await FileSystem.deleteAsync(file.uri, { idempotent: true });
      }
    } catch (error) {
      setStatus("Unable to export report.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title="Progress overview"
          subtitle="Track daily bowel outcomes or compare meds/protocol impact."
        />

        <SegmentedControl options={viewOptions} value={chartMode} onChange={setChartMode} />

        {!loading && entries.length > 0 ? (
          <Card>
            <View style={styles.streakHeader}>
              <CardTitle>Streaks</CardTitle>
              <Text style={styles.streakHint}>
                Counting back from today. Skipped days reset the count.
              </Text>
            </View>
            <View style={styles.streakRow}>
              <View style={styles.streakHero}>
                <Text style={styles.streakHeroEmoji}>
                  {currentAccidentFreeStreak >= 7
                    ? "\uD83C\uDF1F"
                    : currentAccidentFreeStreak >= 3
                      ? "\uD83D\uDD25"
                      : "\u2728"}
                </Text>
                <Text style={styles.streakHeroNumber}>{currentAccidentFreeStreak}</Text>
                <Text style={styles.streakHeroLabel}>
                  {currentAccidentFreeStreak === 1 ? "day" : "days"} accident-free
                </Text>
              </View>
              <View style={styles.streakSecondary}>
                <View style={styles.streakChip}>
                  <Text style={styles.streakChipNumber}>{longestStreak}</Text>
                  <Text style={styles.streakChipLabel}>Best (30d)</Text>
                </View>
                <View style={styles.streakChip}>
                  <Text style={styles.streakChipNumber}>{currentLoggingStreak}</Text>
                  <Text style={styles.streakChipLabel}>Logging streak</Text>
                </View>
                <View style={styles.streakChip}>
                  <Text style={styles.streakChipNumber}>{currentTimedSitsStreak}</Text>
                  <Text style={styles.streakChipLabel}>Timed sits streak</Text>
                </View>
              </View>
            </View>
          </Card>
        ) : null}

        {!loading && hasWeeklyData ? (
          <Card>
            <View style={styles.streakHeader}>
              <CardTitle>Your weeks</CardTitle>
              <Text style={styles.streakHint}>
                Green = clean days (no accidents, no leaks/smears). Thin blue =
                days with a BM. Both bars full is the goal.
              </Text>
            </View>
            {weeklyView.map((week) =>
              week.logged === 0 ? null : (
                <View key={week.key} style={styles.weekRow}>
                  <View style={styles.weekHeaderRow}>
                    <Text style={styles.weekLabel}>{week.label}</Text>
                    <Text style={styles.weekCounts}>
                      {week.clean}/{week.logged} clean {"\u00B7"} {week.bm}/
                      {week.logged} BM days
                    </Text>
                  </View>
                  <View style={styles.weekTrack}>
                    <View
                      style={[
                        styles.weekFillClean,
                        { width: `${Math.round(week.cleanPct * 100)}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.weekTrackThin}>
                    <View
                      style={[
                        styles.weekFillBm,
                        { width: `${Math.round(week.bmPct * 100)}%` },
                      ]}
                    />
                  </View>
                  {week.changeNote ? (
                    <Text style={styles.weekChangeNote}>
                      {"\u2B06"} {week.changeNote}
                    </Text>
                  ) : null}
                </View>
              )
            )}
          </Card>
        ) : null}

        {loading ? <ActivityIndicator color={theme.colors.primary} /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {!loading && activeMetrics.length === 0 ? (
          <Card>
            <EmptyState
              title="Charts need a few days"
              body="Log 3 days and trends will start to appear."
            />
          </Card>
        ) : null}

        {activeMetrics.length > 0 ? (
          <Card>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: colors.sp }]} />
                <Text style={styles.legendLabel}>Spontaneous</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: colors.enema }]} />
                <Text style={styles.legendLabel}>Suppository-induced BM</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: colors.leaks }]} />
                <Text style={styles.legendLabel}>Accidents / Leaks</Text>
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
          </Card>
        ) : null}

        <Card title="Weekly support">
          {last7LoggedDays < 7 ? (
            <Text style={styles.reportMeta}>
              Log at least 7 days to unlock weekly support insights.
            </Text>
          ) : (
            <Text style={styles.patternText}>{supportiveMessage}</Text>
          )}
        </Card>

        <Card>
          <View style={styles.reportHeaderRow}>
            <View style={styles.reportHeaderText}>
              <CardTitle>Pediatrician report (last 30 days)</CardTitle>
              <Text style={styles.reportMeta}>
                {reportChildName} · {reportStart} - {reportEnd}
              </Text>
            </View>
            <PrimaryButton title="Export report" onPress={handleExportReport} />
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
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Timed sits completed</Text>
              <Text style={styles.summaryValue}>{timedSitsDays}</Text>
            </View>
            <View style={styles.summaryCardFull}>
              <Text style={styles.summaryLabel}>Average days between stools</Text>
              <Text style={styles.summaryValue}>
                {averageInterval === null ? "N/A" : averageInterval.toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.reportSection}>
            <CardTitle>Accidents per week</CardTitle>
            <BarChart
              labels={weekLabels}
              values={accidentsPerWeek}
              color={theme.data.chart.accidents}
            />
          </View>

          <View style={styles.reportSection}>
            <CardTitle>Bowel movements per week</CardTitle>
            <BarChart labels={weekLabels} values={bmsPerWeek} color={theme.data.chart.bm} />
          </View>

          <View style={styles.reportSection}>
            <CardTitle>Stool interval trend</CardTitle>
            <LineChart
              labels={intervalData.map((item) => item.label)}
              values={intervalData.map((item) => item.value)}
            />
          </View>

          <View style={styles.reportSection}>
            <CardTitle>Detected patterns</CardTitle>
            {patterns.map((pattern) => (
              <Text key={pattern} style={styles.patternText}>
                • {pattern}
              </Text>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    container: {
      padding: t.spacing.gutter,
      gap: t.spacing.cardGap,
    },
    status: {
      ...t.typography.label,
      color: t.colors.danger,
    },
    emptyText: {
      ...t.typography.body,
      color: t.colors.textSecondary,
    },
    legendRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: t.spacing.md,
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
      ...t.typography.label,
      color: t.colors.textPrimary,
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
      backgroundColor: t.colors.border,
    },
    chartRow: {
      flexDirection: "row",
      gap: 10,
      paddingTop: 6,
      paddingBottom: t.spacing.sm,
    },
    barGroup: {
      alignItems: "center",
      gap: t.spacing.xs,
      paddingHorizontal: 6,
      justifyContent: "flex-end",
    },
    bar: {
      borderRadius: 6,
    },
    // Chart micro-labels sit below the smallest step of the type scale, so the
    // size stays literal while the face comes from the font tokens.
    barValue: {
      fontFamily: t.fontFamily.sansSemiBold,
      fontSize: 11,
      color: t.colors.textPrimary,
    },
    barLabelSmall: {
      fontFamily: t.fontFamily.sans,
      fontSize: 10,
      color: t.colors.textSecondary,
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
      backgroundColor: t.colors.inputFill,
    },
    barStackWide: {
      width: 28,
    },
    barSegment: {
      width: "100%",
    },
    barLabel: {
      fontFamily: t.fontFamily.sans,
      fontSize: 10,
      color: t.colors.textSecondary,
      marginTop: t.spacing.xs,
      minHeight: 12,
      textAlign: "center",
    },
    countLabel: {
      fontFamily: t.fontFamily.sans,
      fontSize: 10,
      color: t.colors.textMuted,
      marginTop: 2,
      textAlign: "center",
    },
    reportHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: t.spacing.md,
    },
    reportHeaderText: {
      flexShrink: 1,
    },
    reportMeta: {
      ...t.typography.caption,
      color: t.colors.textSecondary,
      marginTop: t.spacing.xs,
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: t.spacing.md,
    },
    summaryCard: {
      flexBasis: "48%",
      backgroundColor: t.colors.background,
      borderRadius: t.radii.input,
      padding: t.spacing.md,
      gap: 6,
    },
    summaryCardFull: {
      flexBasis: "100%",
      backgroundColor: t.colors.background,
      borderRadius: t.radii.input,
      padding: t.spacing.md,
      gap: 6,
    },
    summaryLabel: {
      ...t.typography.caption,
      color: t.colors.textSecondary,
    },
    summaryValue: {
      fontFamily: t.fontFamily.sansBold,
      fontSize: 16,
      color: t.colors.textPrimary,
    },
    reportSection: {
      gap: t.spacing.sm,
    },
    patternText: {
      ...t.typography.body,
      color: t.colors.textPrimary,
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
      backgroundColor: t.colors.border,
    },
    lineSegment: {
      position: "absolute",
      height: 2,
      backgroundColor: t.colors.primary,
    },
    linePoint: {
      position: "absolute",
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.colors.primary,
    },
    lineLabel: {
      position: "absolute",
      fontFamily: t.fontFamily.sans,
      fontSize: 10,
      color: t.colors.textSecondary,
      width: 50,
      textAlign: "center",
    },
    streakHeader: {
      gap: 2,
    },
    streakHint: {
      ...t.typography.caption,
      color: t.colors.textMuted,
    },
    streakRow: {
      flexDirection: "row",
      gap: t.spacing.md,
      alignItems: "stretch",
    },
    streakHero: {
      flex: 1,
      backgroundColor: t.colors.primaryTint,
      borderRadius: t.radii.card,
      padding: t.spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      gap: t.spacing.xs,
      minWidth: 130,
    },
    streakHeroEmoji: {
      fontSize: 28,
    },
    streakHeroNumber: {
      fontFamily: t.fontFamily.sansBold,
      fontSize: 36,
      lineHeight: 40,
      color: t.colors.primaryDark,
    },
    streakHeroLabel: {
      ...t.typography.label,
      color: t.colors.primaryDark,
      textAlign: "center",
    },
    streakSecondary: {
      flex: 1,
      gap: t.spacing.sm,
      justifyContent: "space-between",
    },
    streakChip: {
      backgroundColor: t.colors.background,
      borderRadius: t.radii.input,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: t.spacing.sm,
    },
    streakChipNumber: {
      fontFamily: t.fontFamily.sansBold,
      fontSize: 18,
      color: t.colors.textPrimary,
    },
    streakChipLabel: {
      ...t.typography.label,
      color: t.colors.textSecondary,
      textAlign: "right",
      flex: 1,
    },
    weekRow: {
      gap: 5,
    },
    weekHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: t.spacing.sm,
    },
    weekLabel: {
      ...t.typography.label,
      color: t.colors.textPrimary,
    },
    weekCounts: {
      ...t.typography.caption,
      color: t.colors.textSecondary,
    },
    weekTrack: {
      height: 14,
      borderRadius: 7,
      backgroundColor: t.colors.inputFill,
      overflow: "hidden",
    },
    weekFillClean: {
      height: "100%",
      borderRadius: 7,
      backgroundColor: t.data.dayClear,
    },
    weekTrackThin: {
      height: 5,
      borderRadius: 3,
      backgroundColor: t.colors.inputFill,
      overflow: "hidden",
    },
    weekFillBm: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: t.data.chart.bm,
    },
    weekChangeNote: {
      ...t.typography.caption,
      color: t.colors.success,
      marginTop: 2,
    },
  });
