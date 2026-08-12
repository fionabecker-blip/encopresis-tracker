import { useCallback, useEffect, useMemo, useState } from "react";
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
import * as FileSystem from "expo-file-system/legacy";
import { loadEntries, loadSettings } from "../utils/storage";
import type { Entry } from "../types";
import { Calendar } from "react-native-calendars";
import SegmentedControl from "../components/SegmentedControl";
import Card, { CardTitle } from "../../src/components/Card";
import ScreenHeader from "../../src/components/ScreenHeader";
import EmptyState from "../../src/components/EmptyState";
import { useTheme } from "../../src/theme/useTheme";
import { type Theme } from "../../src/theme/tokens";
// The exported PDF is its own document, not a screenshot of the app: white
// stock, no icons, and never the device color scheme. See reportTemplate.
import {
  loadReportFontCss,
  renderReportDocument,
} from "../../src/report/reportTemplate";

// A day counts as an "accident" day if it had a fecal accident, a urine
// accident, or a leak/smear. Clinically these are symptoms of the same
// problem and none is "better" than another, so they share one color.
/** Assumed volume of one glass, used to turn the logged glass count into the
 *  millilitres a clinician expects to read. */
const ML_PER_GLASS = 250;

const getDayStatus = (entry) => {
  if (!entry) return "none";
  const fecal = entry.fecal_accidents ? entry.fecal_accidents > 0 : false;
  const urine = entry.urine_accidents ? entry.urine_accidents > 0 : false;
  const leaks = entry.leaks === true;
  return fecal || urine || leaks ? "accident" : "clear";
};

// Escape user-entered text before interpolating it into export HTML, so
// notes containing <, >, & can't inject markup into the generated PDF.
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

// Build "encopresis-log-{child}-{firstDate}-to-{lastDate}.{ext}"
const buildExportFilename = (
  childName: string,
  entries: { date?: string }[],
  ext: string
) => {
  const dates = entries
    .map((e) => e.date)
    .filter((d): d is string => !!d)
    .sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  const range = first && last ? `${first}-to-${last}` : new Date().toISOString().split("T")[0];
  return `encopresis-log-${slugify(childName)}-${range}.${ext}`;
};

export default function HistoryScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const statusColor = (status) => {
    if (status === "clear") return theme.data.dayClear;
    if (status === "accident") return theme.data.dayAccident;
    return theme.data.dayUnlogged;
  };

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedDate, setSelectedDate] = useState("");
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [childName, setChildName] = useState("");

  useEffect(() => {
    loadSettings().then((s) => setChildName(s.childName || ""));
  }, []);

  const toggleCard = (id) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setStatus("");
    try {
      const data = await loadEntries();
      // Sort newest first to match previous API behaviour
      const sorted = [...data].sort((a, b) =>
        (b.date || "").localeCompare(a.date || "")
      );
      setEntries(sorted);
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

  // Yes/no fields: an unanswered value counts as "No" — the daily log form
  // always records an explicit answer, and older entries without one simply
  // mean the parent didn't tap Yes.
  const formatBoolean = (value) => (value === true ? "Yes" : "No");

  const smearTypeLabels: Record<string, string> = {
    urine: "urine leak",
    fecal: "fecal smear",
    both: "urine leak + fecal smear",
  };
  const formatSmears = (entry) => {
    if (entry.leaks !== true) return "No";
    const type = smearTypeLabels[entry.leak_type];
    return type ? `Yes (${type})` : "Yes";
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

  const bristolLabels = {
    1: "Separate hard lumps",
    2: "Sausage-shaped and lumpy",
    3: "Sausage-shaped with cracks",
    4: "Smooth and soft",
    5: "Soft blobs with clear edges",
    6: "Fluffy, ragged \u2014 loose",
    7: "Watery, no solid pieces",
  };

  const formatBristolType = (value) => {
    if (value === null || value === undefined) return "Not recorded";
    return bristolLabels[value] ? `Type ${value} \u2014 ${bristolLabels[value]}` : `Type ${value}`;
  };

  const formatBristolTypeExport = (value) => {
    if (value === null || value === undefined) return "";
    return bristolLabels[value] ? `Type ${value} \u2014 ${bristolLabels[value]}` : `Type ${value}`;
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

  // Water is logged as a glass count, but clinicians want a volume, so glasses
  // are converted at 250 ml each. Entries predating the stepper carry their own
  // oz/ml unit and are passed through untouched rather than mis-converted.
  const formatWater = (entry: Entry) => {
    const amount = entry.water_intake;
    if (amount === null || amount === undefined) return "";
    if (entry.water_unit === "glasses") return `${amount * ML_PER_GLASS} ml`;
    return [amount, entry.water_unit].filter(Boolean).join(" ");
  };

  // Build the full list of rows for an entry, marking which are "logged" (worth
  // showing in the collapsed view) vs. blanks (only shown when expanded).
  const buildRows = (entry) => {
    const numLogged = (v) => v !== null && v !== undefined && v > 0;
    const strLogged = (v) => !!(v && String(v).trim());
    const arrLogged = (v) => Array.isArray(v) && v.length > 0;
    const dosesLogged = (v) =>
      v && typeof v === "object" && Object.values(v).some((d) => d);
    const waterLogged = entry.water_intake !== null && entry.water_intake !== undefined;
    const fiberLogged = entry.fiber_intake !== null && entry.fiber_intake !== undefined;

    return [
      {
        key: "fecal",
        label: "Fecal accidents",
        value: formatNumber(entry.fecal_accidents),
        logged: numLogged(entry.fecal_accidents),
      },
      {
        key: "urine",
        label: "Urine accidents",
        value: formatNumber(entry.urine_accidents),
        logged: numLogged(entry.urine_accidents),
      },
      {
        key: "leaks",
        label: "Leaks/Smears",
        value: formatSmears(entry),
        logged: entry.leaks === true,
      },
      {
        key: "bm_type",
        label: "BM type",
        value: formatText(entry.bm_type),
        logged: strLogged(entry.bm_type) && entry.bm_type !== "none",
      },
      {
        key: "bm_notes",
        label: "BM notes",
        value: formatText(entry.bm_notes),
        logged: strLogged(entry.bm_notes),
      },
      {
        key: "poop_consistency",
        label: "Poop consistency",
        value: formatPoopConsistency(entry.poop_consistency),
        logged: strLogged(entry.poop_consistency),
      },
      {
        key: "bristol_type",
        label: "Bristol type",
        value: formatBristolType(entry.bristol_type),
        logged: entry.bristol_type !== null && entry.bristol_type !== undefined,
      },
      {
        key: "medication",
        label: "Meds/Protocol",
        value: formatMedication(entry.medication),
        logged: arrLogged(entry.medication) || strLogged(entry.medication),
      },
      {
        key: "medication_doses",
        label: "Medication amounts",
        value: formatMedicationDoses(entry.medication_doses),
        logged: dosesLogged(entry.medication_doses),
      },
      {
        key: "motility_foods",
        label: "Hydration/Diet",
        value: formatMotilityFoods(entry.motility_foods),
        logged: arrLogged(entry.motility_foods),
      },
      {
        key: "water",
        label: "Water",
        value: waterLogged ? formatWater(entry) : "Not logged",
        logged: waterLogged,
      },
      {
        key: "fiber",
        label: "Fiber",
        value: fiberLogged
          ? `${entry.fiber_intake} ${entry.fiber_unit ?? ""}`
          : "Not logged",
        logged: fiberLogged,
      },
      {
        key: "clean_out",
        label: "Clean out",
        value: formatBoolean(entry.clean_out),
        logged: entry.clean_out === true,
      },
      {
        key: "clean_out_notes",
        label: "Clean out notes",
        value: formatText(entry.clean_out_notes),
        logged: strLogged(entry.clean_out_notes),
      },
      {
        key: "timed_sits",
        label: "Timed sits completed",
        value: formatBoolean(entry.timed_sits_completed),
        logged: entry.timed_sits_completed === true,
      },
      {
        key: "proper_sitting",
        label: "Proper sitting position",
        value: formatBoolean(entry.proper_sitting_position),
        logged: entry.proper_sitting_position === true,
      },
      {
        key: "abdominal_pain",
        label: "Abdominal pain",
        value: formatBoolean(entry.abdominal_pain),
        logged: entry.abdominal_pain === true,
      },
      {
        key: "withholding",
        label: "Withholding behavior",
        value: formatBoolean(entry.withholding_behavior),
        logged: entry.withholding_behavior === true,
      },
      {
        key: "activity",
        label: "Activity 30 min",
        value: formatBoolean(entry.activity_30_min),
        logged: entry.activity_30_min === true,
      },
      {
        key: "activity_types",
        label: "Activity types",
        value: entry.activity_types?.length ? entry.activity_types.join(", ") : "None",
        logged: (entry.activity_types?.length ?? 0) > 0,
      },
      {
        key: "notes",
        label: "Notes",
        value: formatText(entry.notes),
        logged: strLogged(entry.notes),
      },
    ];
  };

  const renderEntryCard = (entry) => {
    const rows = buildRows(entry);
    const isExpanded = expandedCards.has(entry.id);
    const visibleRows = isExpanded ? rows : rows.filter((r) => r.logged);
    return (
      <Card key={entry.id} title={entry.date}>
        {visibleRows.length === 0 ? (
          <Text style={styles.emptyText}>{"Entry saved \u2014 no details logged."}</Text>
        ) : (
          visibleRows.map((row) => (
            <View key={row.key} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue}>{row.value}</Text>
            </View>
          ))
        )}
        <TouchableOpacity onPress={() => toggleCard(entry.id)} style={styles.expandRow}>
          <Text style={styles.expandText}>
            {isExpanded ? "Show less" : "Show all fields"}
          </Text>
        </TouchableOpacity>
      </Card>
    );
  };

  const entriesByDate = entries.reduce((acc, entry) => {
    if (!entry.date) return acc;
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const selectedEntries = selectedDate ? entriesByDate[selectedDate] || [] : [];

  // Per-date status for the heatmap: "clear" | "accident" | "none"
  const dateStatus = Object.keys(entriesByDate).reduce((acc, date) => {
    // If any entry for the day had an accident *or* a leak/smear, the whole
    // day is marked "accident" — they share a single color.
    const dayEntries = entriesByDate[date];
    const hasAccident = dayEntries.some(
      (entry) => getDayStatus(entry) === "accident"
    );
    acc[date] = hasAccident ? "accident" : "clear";
    return acc;
  }, {});

  const markedDates = Object.keys(dateStatus).reduce((acc, date) => {
    acc[date] = { status: dateStatus[date] };
    return acc;
  }, {});

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
    };
  }

  const HeatmapDay = ({ date, state, marking }) => {
    if (!date) return null;
    const color = statusColor(marking?.status);
    const isSelected = marking?.selected;
    const isDisabled = state === "disabled";
    return (
      <TouchableOpacity
        style={styles.heatDayCell}
        onPress={() => setSelectedDate(date.dateString)}
        disabled={isDisabled}
      >
        <View
          style={[
            styles.heatSquare,
            { backgroundColor: color },
            isSelected && styles.heatSquareSelected,
          ]}
        >
          <Text
            style={[
              styles.heatDayText,
              marking?.status && marking.status !== "none" && styles.heatDayTextOnColor,
              isDisabled && styles.heatDayTextDisabled,
            ]}
          >
            {date.day}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const buildCsv = () => {
    const header = [
      "Date",
      "Fecal accidents",
      "Urine accidents",
      "Leaks/Smears",
      "Leak/Smear type",
      "BM type",
      "BM notes",
      "Poop consistency",
      "Bristol type",
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
      "Proper sitting position",
      "Abdominal pain",
      "Withholding behavior",
      "Activity 30 min",
      "Activity types",
      "Notes",
    ];
    const rows = entries.map((entry) => [
      entry.date,
      entry.fecal_accidents ?? "",
      entry.urine_accidents ?? "",
      entry.leaks === undefined ? "" : entry.leaks ? "Yes" : "No",
      entry.leaks === true ? (smearTypeLabels[entry.leak_type] ?? "") : "",
      entry.bm_type ?? "",
      entry.bm_notes ?? "",
      formatPoopConsistency(entry.poop_consistency),
      formatBristolTypeExport(entry.bristol_type),
      formatMedicationExport(entry.medication),
      formatMedicationDosesExport(entry.medication_doses),
      formatMotilityFoodsExport(entry.motility_foods),
      // Converted here too, so the CSV and the PDF never disagree on a number.
      entry.water_unit === "glasses"
        ? (entry.water_intake ?? 0) * ML_PER_GLASS
        : entry.water_intake ?? "",
      entry.water_unit === "glasses" ? "ml" : entry.water_unit ?? "",
      entry.fiber_intake ?? "",
      entry.fiber_unit ?? "",
      entry.clean_out === undefined ? "" : entry.clean_out ? "Yes" : "No",
      entry.clean_out_notes ?? "",
      entry.timed_sits_completed === undefined ? "" : entry.timed_sits_completed ? "Yes" : "No",
      entry.proper_sitting_position === undefined ? "" : entry.proper_sitting_position ? "Yes" : "No",
      entry.abdominal_pain === undefined ? "" : entry.abdominal_pain ? "Yes" : "No",
      entry.withholding_behavior === undefined ? "" : entry.withholding_behavior ? "Yes" : "No",
      entry.activity_30_min === undefined ? "" : entry.activity_30_min ? "Yes" : "No",
      entry.activity_types?.length ? entry.activity_types.join("; ") : "",
      entry.notes ?? "",
    ]);
    return [header, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            let text = String(cell);
            // Neutralize spreadsheet formula injection: a cell starting with
            // =, +, -, @ or a tab/CR would execute as a formula in Excel/Sheets.
            if (/^[=+\-@\t\r]/.test(text)) {
              text = `'${text}`;
            }
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
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
      const fileName = buildExportFilename(childName, entries, "csv");
      // Use cacheDirectory (not documentDirectory) so health data doesn't
      // persist in iCloud-backed storage; the file is deleted after sharing.
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      try {
        await FileSystem.writeAsStringAsync(fileUri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Share CSV",
          UTI: "public.comma-separated-values-text",
        });
      } finally {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } catch (error) {
      setStatus("Unable to export CSV.");
    }
  };

  // Summary stats for the PDF cover page.
  const buildSummary = () => {
    const sortedDates = entries
      .map((e) => e.date)
      .filter(Boolean)
      .sort();
    const firstDate = sortedDates[0] || "\u2014";
    const lastDate = sortedDates[sortedDates.length - 1] || "\u2014";

    const totalEntries = entries.length;
    const totalFecal = entries.reduce(
      (sum, e) => sum + (Number(e.fecal_accidents) || 0),
      0
    );
    const totalUrine = entries.reduce(
      (sum, e) => sum + (Number(e.urine_accidents) || 0),
      0
    );
    const totalLeaks = entries.filter((e) => e.leaks === true).length;
    const totalBms = entries.filter(
      (e) => e.bm_type === "sp" || e.bm_type === "enema"
    ).length;
    const totalCleanOuts = entries.filter((e) => e.clean_out === true).length;
    const totalTimedSitsDays = entries.filter(
      (e) => e.timed_sits_completed === true
    ).length;
    const totalAbdominalPainDays = entries.filter(
      (e) => e.abdominal_pain === true
    ).length;
    const totalWithholdingDays = entries.filter(
      (e) => e.withholding_behavior === true
    ).length;

    return {
      firstDate,
      lastDate,
      totalEntries,
      totalFecal,
      totalUrine,
      totalLeaks,
      totalBms,
      totalCleanOuts,
      totalTimedSitsDays,
      totalAbdominalPainDays,
      totalWithholdingDays,
    };
  };

  // Pagination budget for the daily log, in CSS px at 96dpi.
  //
  // A fixed rows-per-page count can't work here: the notes fields are free text,
  // so one row may be a single line and the next may be six. Since the footer
  // numbers the pages, a row that overflows its sheet would misnumber every page
  // after it. So rows are packed against a measured height budget instead.
  //
  // Constants below were measured from the rendered template (landscape Letter,
  // 0.5in margins): 8.5in - 1in = 7.5in = 720px, less the letterhead, rule,
  // heading, table head and footer.
  const LOG_PAGE_BUDGET_PX = 720 - 197;
  const LOG_ROW_LINE_PX = 15; // one line of 8pt text at 1.45 line-height
  const LOG_ROW_PADDING_PX = 9; // 4px top + 4px bottom + 1px rule

  /**
   * Approximate printed height of one log row: the tallest cell wins, and a
   * cell's line count is its text length over the characters that fit its
   * column. Deliberately errs high — a short page is harmless, an overflowing
   * one breaks the page numbering.
   */
  const estimateRowHeight = (
    values: string[],
    columns: { width: string; nowrap?: boolean }[]
  ): number => {
    const usableWidthPx = 960; // 10in of landscape Letter inside the margins
    // Measured against the rendered table, then rounded up: text wraps at
    // spaces, so a column fits fewer characters per line than raw glyph width
    // suggests. Under-estimating here overflows a sheet and misnumbers the
    // pages, so this errs wide on purpose.
    const pxPerChar = 6;
    const lines = values.map((value, index) => {
      const column = columns[index];
      if (!column || column.nowrap) return 1;
      // Less the 4px cell gutter set by `table.dense` in the report stylesheet.
      const columnPx = (parseFloat(column.width) / 100) * usableWidthPx - 4;
      const charsPerLine = Math.max(1, Math.floor(columnPx / pxPerChar));
      return Math.max(1, Math.ceil(value.length / charsPerLine));
    });
    return Math.max(1, ...lines) * LOG_ROW_LINE_PX + LOG_ROW_PADDING_PX;
  };

  const buildHtml = (fontCss: string) => {
    const summary = buildSummary();

    const summaryRow = (label: string, value: string) => `
      <tr><td>${label}</td><td class="num">${value}</td></tr>`;

    const summaryPage = `
      <h2>Bowel movement daily log</h2>
      <p class="lede">${summary.totalEntries} ${summary.totalEntries === 1 ? "entry" : "entries"} recorded.</p>

      <h2>Summary</h2>
      <table>
        <tbody>
          ${summaryRow("Bowel movements (spontaneous + suppository/enema)", String(summary.totalBms))}
          ${summaryRow("Fecal accidents", String(summary.totalFecal))}
          ${summaryRow("Urine accidents", String(summary.totalUrine))}
          ${summaryRow("Days with leaks/smears", String(summary.totalLeaks))}
          ${summaryRow("Clean-out days", String(summary.totalCleanOuts))}
          ${summaryRow("Timed sits days", String(summary.totalTimedSitsDays))}
          ${summaryRow("Abdominal pain days", String(summary.totalAbdominalPainDays))}
          ${summaryRow("Withholding behavior days", String(summary.totalWithholdingDays))}
        </tbody>
      </table>`;

    // 23 columns across a landscape page leaves roughly 42px each, so headings
    // are kept to one short word wherever the meaning survives it. Widths total
    // 100%; `nowrap` marks columns whose values must never break.
    const columns: {
      label: string;
      width: string;
      numeric?: boolean;
      nowrap?: boolean;
    }[] = [
      { label: "Date", width: "6.4%", nowrap: true },
      { label: "Fecal", width: "3.6%", numeric: true },
      { label: "Urine", width: "3.6%", numeric: true },
      { label: "Leaks", width: "3.8%" },
      { label: "Leak type", width: "4.4%" },
      { label: "BM type", width: "4.4%" },
      { label: "BM notes", width: "5.1%" },
      { label: "Stool form", width: "4.3%" },
      { label: "Bristol", width: "4.2%" },
      { label: "Meds", width: "4.4%" },
      { label: "Doses", width: "4%" },
      { label: "Motility foods", width: "4.6%" },
      { label: "Water", width: "4%", numeric: true },
      { label: "Fiber", width: "4%", numeric: true },
      { label: "Clean out", width: "4%" },
      { label: "Clean out notes", width: "3.8%" },
      { label: "Sits", width: "3.2%" },
      { label: "Sit position", width: "4.6%" },
      { label: "Pain", width: "3.2%" },
      { label: "Withhold", width: "5.4%" },
      { label: "Active", width: "4%" },
      { label: "Activity types", width: "4.6%" },
      { label: "Notes", width: "6.4%" },
    ];

    const yesNo = (value: boolean | undefined) =>
      value === undefined ? "" : value ? "Yes" : "No";

    const cells = (entry: Entry): string[] => [
      esc(entry.date),
      entry.fecal_accidents == null ? "" : String(entry.fecal_accidents),
      entry.urine_accidents == null ? "" : String(entry.urine_accidents),
      yesNo(entry.leaks),
      entry.leaks === true && entry.leak_type
        ? esc(smearTypeLabels[entry.leak_type] ?? "")
        : "",
      esc(entry.bm_type),
      esc(entry.bm_notes),
      esc(formatPoopConsistency(entry.poop_consistency)),
      esc(formatBristolTypeExport(entry.bristol_type)),
      esc(formatMedicationExport(entry.medication)),
      esc(formatMedicationDosesExport(entry.medication_doses)),
      esc(formatMotilityFoodsExport(entry.motility_foods)),
      esc(formatWater(entry)),
      esc([entry.fiber_intake, entry.fiber_unit].filter(Boolean).join(" ")),
      yesNo(entry.clean_out),
      esc(entry.clean_out_notes),
      yesNo(entry.timed_sits_completed),
      yesNo(entry.proper_sitting_position),
      yesNo(entry.abdominal_pain),
      yesNo(entry.withholding_behavior),
      yesNo(entry.activity_30_min),
      esc(entry.activity_types?.length ? entry.activity_types.join(", ") : ""),
      esc(entry.notes),
    ];

    const head = `
      <thead>
        <tr>
          ${columns
            .map(
              (column) =>
                `<th class="${column.numeric ? "num" : ""}" style="width:${column.width}">${column.label}</th>`
            )
            .join("")}
        </tr>
      </thead>`;

    const renderRow = (values: string[]) => `
      <tr>${values
        .map(
          (value, index) =>
            `<td class="${[
              columns[index]?.numeric ? "num" : "",
              columns[index]?.nowrap ? "nowrap" : "",
            ]
              .filter(Boolean)
              .join(" ")}">${value}</td>`
        )
        .join("")}</tr>`;

    // Pack rows into sheets against the height budget. A row taller than a whole
    // page still gets its own sheet rather than an empty one before it.
    const chunks: string[][] = [];
    let current: string[] = [];
    let used = 0;
    entries.forEach((entry) => {
      const values = cells(entry);
      const height = estimateRowHeight(values, columns);
      if (current.length && used + height > LOG_PAGE_BUDGET_PX) {
        chunks.push(current);
        current = [];
        used = 0;
      }
      current.push(renderRow(values));
      used += height;
    });
    if (current.length) chunks.push(current);

    const logPages = chunks.map((rowsHtml, index) => {
      const rows = rowsHtml.join("");
      const continued = index > 0 ? " (continued)" : "";
      return `
        <h2>Daily entries${continued}</h2>
        <table class="dense">${head}<tbody>${rows}</tbody></table>`;
    });

    return renderReportDocument({
      fontCss,
      patient: childName || "(unspecified)",
      range: `${summary.firstDate} \u2013 ${summary.lastDate}`,
      // The wide log needs the long edge; the summary rides along with it so the
      // export stays a single document.
      orientation: "landscape",
      pages: [summaryPage, ...logPages],
    });
  };

  const handleExportPdf = async () => {
    if (!entries.length) {
      setStatus("Add entries before exporting.");
      return;
    }
    try {
      const fontCss = await loadReportFontCss();
      const html = buildHtml(fontCss);
      const file = await Print.printToFileAsync({ html });
      const fileName = buildExportFilename(childName, entries, "pdf");
      // Use cacheDirectory (not documentDirectory) so health data doesn't
      // persist in iCloud-backed storage; files are deleted after sharing.
      const namedUri = `${FileSystem.cacheDirectory}${fileName}`;
      try {
        try {
          // Remove any stale copy from a previous export so moveAsync doesn't fail.
          await FileSystem.deleteAsync(namedUri, { idempotent: true });
          await FileSystem.moveAsync({ from: file.uri, to: namedUri });
        } catch {
          // If rename fails for any reason, fall back to sharing the original temp file.
          await Sharing.shareAsync(file.uri, { dialogTitle: "Share PDF" });
          return;
        }
        await Sharing.shareAsync(namedUri, {
          mimeType: "application/pdf",
          dialogTitle: "Share PDF",
          UTI: "com.adobe.pdf",
        });
      } finally {
        await FileSystem.deleteAsync(namedUri, { idempotent: true });
        await FileSystem.deleteAsync(file.uri, { idempotent: true });
      }
    } catch (error) {
      setStatus("Unable to export PDF.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <ScreenHeader title="Daily history" />
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

        {loading ? <ActivityIndicator color={theme.colors.primary} /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {!loading && entries.length === 0 ? (
          <Card>
            <EmptyState
              title="No entries yet"
              body="Your first saved day will appear here."
            />
          </Card>
        ) : null}

        {viewMode === "calendar" ? (
          <Card>
            <Calendar
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              dayComponent={HeatmapDay}
            />

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSwatch,
                    { backgroundColor: theme.data.dayClear },
                  ]}
                />
                <Text style={styles.legendText}>Accident-free day</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSwatch,
                    { backgroundColor: theme.data.dayAccident },
                  ]}
                />
                <Text style={styles.legendText}>Accident or leak</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, styles.legendSwatchEmpty]} />
                <Text style={styles.legendText}>Not logged</Text>
              </View>
            </View>

            <View style={styles.selectedSection}>
              <CardTitle>
                {selectedDate ? `Entries for ${selectedDate}` : "Select a date"}
              </CardTitle>
              {selectedEntries.length === 0 ? (
                <Text style={styles.emptyText}>No entries for this day.</Text>
              ) : (
                selectedEntries.map(renderEntryCard)
              )}
            </View>
          </Card>
        ) : (
          entries.map(renderEntryCard)
        )}
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
    headerRow: {
      gap: t.spacing.sectionGap,
    },
    exportRow: {
      flexDirection: "row",
      gap: t.spacing.md,
      flexWrap: "wrap",
    },
    secondaryButton: {
      backgroundColor: t.colors.inputFill,
      borderRadius: t.radii.button,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryButtonText: {
      ...t.typography.button,
      color: t.colors.textPrimary,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: t.spacing.md,
    },
    detailLabel: {
      ...t.typography.label,
      color: t.colors.textSecondary,
      flex: 1,
    },
    detailValue: {
      ...t.typography.label,
      color: t.colors.textPrimary,
      flex: 1,
      textAlign: "right",
    },
    status: {
      ...t.typography.body,
      color: t.colors.danger,
    },
    emptyText: {
      ...t.typography.body,
      color: t.colors.textSecondary,
    },
    heatDayCell: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 2,
    },
    heatSquare: {
      width: 30,
      height: 30,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    heatSquareSelected: {
      borderColor: t.colors.primary,
      borderWidth: 2,
    },
    heatDayText: {
      ...t.typography.caption,
      color: t.colors.textPrimary,
    },
    heatDayTextOnColor: {
      fontFamily: t.fontFamily.sansBold,
      color: t.colors.onPrimary,
    },
    heatDayTextDisabled: {
      color: t.colors.textMuted,
    },
    legendRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: t.spacing.md,
      justifyContent: "center",
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.xs,
    },
    legendSwatch: {
      width: 14,
      height: 14,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    legendSwatchEmpty: {
      backgroundColor: t.data.dayUnlogged,
    },
    legendText: {
      ...t.typography.caption,
      color: t.colors.textSecondary,
    },
    expandRow: {
      paddingTop: t.spacing.sm,
      alignItems: "flex-start",
    },
    expandText: {
      ...t.typography.label,
      color: t.colors.primary,
    },
    selectedSection: {
      gap: t.spacing.sectionGap,
    },
  });
