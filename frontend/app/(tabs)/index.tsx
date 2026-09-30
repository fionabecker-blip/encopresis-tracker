import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import SegmentedControl from "../components/SegmentedControl";
import ExerciseDemo, { ExerciseKey } from "../components/ExerciseDemo";
import Card from "../../src/components/Card";
import TextField from "../../src/components/TextField";
import PrimaryButton from "../../src/components/PrimaryButton";
import ScreenHeader from "../../src/components/ScreenHeader";
import InfoIcon from "../../src/components/InfoIcon";
import AppModal from "../../src/components/AppModal";
import Toast from "../../src/components/Toast";
import {
  defaultSettings,
  generateId,
  loadEntries,
  loadSettings,
  saveEntry,
} from "../utils/storage";
import { useTheme } from "../../src/theme/useTheme";
import type { Theme } from "../../src/theme/tokens";

// More parent-friendly BM labels. Values are preserved for backward compatibility
// with existing stored entries.
const bmOptions = [
  { label: "Spontaneous", value: "sp" },
  { label: "Suppository-induced BM", value: "enema" },
  { label: "No BM", value: "none" },
];

const yesNoOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

// Physical activity types. The three core exercises have an animated demo
// (tap the play icon on the chip to watch it).
const activityOptions: { label: string; value: string; demo?: ExerciseKey }[] = [
  { label: "Running", value: "Running" },
  { label: "Jumping", value: "Jumping" },
  { label: "Walking", value: "Walking" },
  { label: "Bear hold", value: "Bear hold", demo: "bear_hold" },
  { label: "Crab walk", value: "Crab walk", demo: "crab_walk" },
  { label: "Froggy jumps", value: "Froggy jumps", demo: "froggy_jumps" },
];

const baseMedsOptions = [
  { label: "Miralax/Restorolax/PEG", value: "Miralax/Restorolax/PEG" },
  { label: "Senna/Exlax", value: "Senna/Exlax" },
  { label: "LGS", value: "LGS" },
  { label: "Multi-Mop", value: "Multi-Mop" },
  { label: "MOP x", value: "MOP x" },
  { label: "Mag citrate", value: "Mag citrate" },
  { label: "None/Not taken", value: "None/Not taken" },
];

const bristolDescriptors = [
  { type: 1, label: "Separate hard lumps, like small pellets (hard to pass)" },
  { type: 2, label: "Sausage-shaped and lumpy (hard to pass)" },
  { type: 3, label: "Sausage-shaped with cracks on the surface" },
  { type: 4, label: "Smooth and soft, like a sausage or snake \u2014 ideal" },
  { type: 5, label: "Soft blobs with clear-cut edges (easy to pass)" },
  { type: 6, label: "Fluffy, ragged pieces \u2014 loose" },
  { type: 7, label: "Watery, no solid pieces" },
];

const mapBristolToConsistency = (type: number | null): string | undefined => {
  if (!type) return undefined;
  if (type <= 2) return "hard_constipated";
  if (type <= 5) return "soft_normal";
  return "very_loose";
};

// Updated motility food list with parent-friendly motility explanations.
const motilityOptions = [
  {
    label: "Kiwi",
    value: "Kiwi",
    info: "Kiwi contains actinidin, a natural enzyme that helps food move through the gut.",
  },
  {
    label: "Pears",
    value: "Pears",
    info: "Pears are high in sorbitol and soluble fiber, which draws water into stool and softens it.",
  },
  {
    label: "Avocado",
    value: "Avocado",
    info: "Avocado adds healthy fats that lubricate the gut and make stools easier to pass.",
  },
  {
    label: "Olive oil/Butter/Ghee",
    value: "Olive oil/Butter/Ghee",
    info: "Healthy fats coat the gut lining and help stools slide through more easily.",
  },
  {
    label: "Warm liquids",
    value: "Warm liquids",
    info: "Warm liquids relax the gut muscles and can trigger the urge to go.",
  },
  {
    label: "Dragon fruit",
    value: "Dragon fruit",
    info: "Dragon fruit is rich in water and small seeds that gently stimulate the bowels.",
  },
  {
    label: "Papaya",
    value: "Papaya",
    info: "Papaya contains papain, an enzyme that supports digestion and motility.",
  },
  {
    label: "Apples",
    value: "Apples",
    info: "Apples (especially with skin) are high in pectin, a fiber that softens stool.",
  },
];

// Tooltip definitions for clinical terms.
const GLOSSARY = {
  bristol:
    "The Bristol Stool Scale rates poop shape on a 1\u20137 scale. 1\u20132 = hard/constipated, 3\u20135 = normal, 6\u20137 = loose/diarrhea.",
  withholding:
    "Withholding is when a child holds poop in on purpose \u2014 squeezing, crossing legs, hiding, or refusing to sit on the toilet.",
  timedSits:
    "Timed sits are scheduled toilet sits (usually 5\u201310 min) about 20 minutes after meals, taking advantage of the gastrocolic reflex.",
  cleanOut:
    "A clean out is a higher-dose laxative protocol used to clear out stool buildup. Follow your clinician\u2019s instructions.",
  accidentsLeaks:
    "Any stool or urine that escapes without the child\u2019s control \u2014 whether a full accident or a small smear/leak \u2014 signals that the rectum is still enlarged. There is no clinical difference between a \u2018leak\u2019 and an \u2018accident.\u2019 Both mean the same thing: more clean-out is needed. Track every occurrence. Your clinic\u2019s protocol may differ.",
  spontaneous:
    "A spontaneous BM means your child went on their own \u2014 they felt the urge and pooped without needing a suppository. This is the goal!",
  properSitting:
    "Proper sitting position means knees above the pelvis, with feet supported \u2014 use a footstool, a yoga block, or both. This relaxes the pelvic floor and makes it much easier to fully empty.",
  insolubleFiber:
    "Insoluble fiber keeps stool soft and shortens the time it spends in the colon \u2014 so there\u2019s less chance it hardens and backs up. Unlike soluble fiber, it doesn\u2019t rely on the colon contracting to do its job.",
};

type Tooltip = { title: string; message: string };

// Convert a "YYYY-MM-DD" string to a Date at local midnight.
const dateStringToDate = (value: string): Date => {
  const parts = value.split("-");
  if (parts.length !== 3) return new Date();
  const [y, m, d] = parts.map((p) => Number(p));
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
};

const dateToString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** "Sat 9 Aug" — short enough to sit on one toast line beside a streak note. */
const formatToastDate = (value: string): string => {
  const today = dateToString(new Date());
  if (value === today) return "today";
  return dateStringToDate(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

// Only these streaks are called out. Consistency is the thing being praised —
// never the child's symptoms — so the copy is about notes, not outcomes.
const WATER_MIN = 0;
const WATER_MAX = 12;
/** Unit tag written alongside the glass count. Reports key off this to decide
 *  whether to convert to ml, so older oz/ml entries still render as logged. */
const WATER_UNIT_GLASSES = "glasses";

const STREAK_MILESTONES = [3, 7, 14];

/** Consecutive logged days ending at `endDate`. */
const loggingStreak = (loggedDates: Set<string>, endDate: string): number => {
  const cursor = dateStringToDate(endDate);
  let streak = 0;
  while (loggedDates.has(dateToString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export default function LogScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [dateValue, setDateValue] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fecalAccidents, setFecalAccidents] = useState("");
  const [fecalLeaks, setFecalLeaks] = useState("");
  const [urineAccidents, setUrineAccidents] = useState("");
  const [urineLeaks, setUrineLeaks] = useState("");
  const [medsProtocol, setMedsProtocol] = useState<string[]>([]);
  const [medicationDoses, setMedicationDoses] = useState<Record<string, string>>({});
  const [otherMed, setOtherMed] = useState("");
  const [dietItems, setDietItems] = useState<string[]>([]);
  const [otherFood, setOtherFood] = useState("");
  const [bmType, setBmType] = useState("none");
  const [bmNotes, setBmNotes] = useState("");
  const [bristolType, setBristolType] = useState<number | null>(null);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [fiberIntake, setFiberIntake] = useState("");
  const [cleanOut, setCleanOut] = useState("no");
  const [cleanOutNotes, setCleanOutNotes] = useState("");
  const [timedSits, setTimedSits] = useState("no");
  const [properSitting, setProperSitting] = useState("no");
  const [abdominalPain, setAbdominalPain] = useState("no");
  const [withholdingBehavior, setWithholdingBehavior] = useState("no");
  const [activity30Min, setActivity30Min] = useState("no");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [demoExercise, setDemoExercise] = useState<ExerciseKey | null>(null);
  const [notes, setNotes] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  // Build the active meds option list: built-in + user's recurring custom meds + "Other".
  const customMeds = (settings.customMeds || []) as string[];

  // Build the active foods option list: built-in + user's recurring custom foods + "Other".
  const customFoods = (settings.customFoods || []) as string[];
  const foodOptions = [
    ...motilityOptions,
    ...customFoods.map((name) => ({ label: name, value: name, info: null as string | null })),
    { label: "Other\u2026", value: "__other_food__", info: null as string | null },
  ];
  const medsOptions = [
    ...baseMedsOptions.filter((opt) => opt.value !== "None/Not taken"),
    ...customMeds.map((name) => ({ label: name, value: name })),
    { label: "Other\u2026", value: "__other__" },
    { label: "None/Not taken", value: "None/Not taken" },
  ];


  // Explainers render in the app's own modal rather than Alert.alert so they
  // pick up the design system instead of the OS dialog style.
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const showTooltip = (title: string, message: string) =>
    setTooltip({ title, message });

  const onDateChange = (event: DateTimePickerEvent, picked?: Date) => {
    // On Android the picker is a dismissible dialog; on iOS it's inline.
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }
    if (event.type === "dismissed") return;
    if (picked) setDateValue(dateToString(picked));
  };


  const parseNumber = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const resetForm = () => {
    setFecalAccidents("");
    setFecalLeaks("");
    setUrineAccidents("");
    setUrineLeaks("");
    setMedsProtocol([]);
    setMedicationDoses({});
    setOtherMed("");
    setDietItems([]);
    setOtherFood("");
    setBmType("none");
    setBmNotes("");
    setBristolType(null);
    setWaterGlasses(0);
    setFiberIntake("");
    setCleanOut("no");
    setCleanOutNotes("");
    setTimedSits("no");
    setProperSitting("no");
    setAbdominalPain("no");
    setWithholdingBehavior("no");
    setActivity30Min("no");
    setActivityTypes([]);
    setNotes("");
  };

  const medAmountOptions = {
    "Miralax/Restorolax/PEG": settings.medAmountOptions?.miralaxCaps || [
      "1/2 cap",
      "1 cap",
      "2 caps",
    ],
    "Senna/Exlax": settings.medAmountOptions?.sennaSquares || [
      "1 square",
      "2 squares",
      "3 squares",
      "4 squares",
    ],
    "Mag citrate": settings.medAmountOptions?.magCitrateMg || [
      "100 mg",
      "200 mg",
      "400 mg",
    ],
  };

  const handleSubmit = async () => {
    setLoading(true);
    setStatus("");
    try {
      const now = new Date().toISOString();
      const entry: Record<string, unknown> = {
        id: generateId(),
        date: dateValue,
        bm_type: bmType,
        activity_30_min: activity30Min === "yes",
        clean_out: cleanOut === "yes",
        timed_sits_completed: timedSits === "yes",
        proper_sitting_position: properSitting === "yes",
        abdominal_pain: abdominalPain === "yes",
        withholding_behavior: withholdingBehavior === "yes",
        created_at: now,
        updated_at: now,
      };

      const fecal = parseNumber(fecalAccidents);
      const fecalLk = parseNumber(fecalLeaks);
      const urine = parseNumber(urineAccidents);
      const urineLk = parseNumber(urineLeaks);
      const fiber = parseNumber(fiberIntake);

      if (fecal !== undefined) entry.fecal_accidents = fecal;
      if (fecalLk !== undefined) entry.fecal_leaks = fecalLk;
      if (urine !== undefined) entry.urine_accidents = urine;
      if (urineLk !== undefined) entry.urine_leaks = urineLk;
      if (activityTypes.length) entry.activity_types = activityTypes;

      // Resolve the meds list: replace "__other__" sentinel with the free-text value if provided.
      const resolvedMeds = medsProtocol
        .flatMap((m) => (m === "__other__" ? (otherMed.trim() ? [otherMed.trim()] : []) : [m]))
        .filter(Boolean);
      if (resolvedMeds.length) entry.medication = resolvedMeds;

      if (Object.keys(medicationDoses).length) {
        // Filter out any stale __other__ key so we don't leak the sentinel into storage.
        const cleanedDoses = Object.fromEntries(
          Object.entries(medicationDoses).filter(
            ([key, val]) => key !== "__other__" && val
          )
        );
        if (Object.keys(cleanedDoses).length) entry.medication_doses = cleanedDoses;
      }
      // Resolve foods: replace "__other_food__" sentinel with the free-text value if provided.
      const resolvedFoods = dietItems
        .flatMap((f) =>
          f === "__other_food__" ? (otherFood.trim() ? [otherFood.trim()] : []) : [f]
        )
        .filter(Boolean);
      if (resolvedFoods.length) entry.motility_foods = resolvedFoods;
      if (bmNotes.trim()) entry.bm_notes = bmNotes.trim();
      if (bristolType !== null) {
        entry.bristol_type = bristolType;
        const consistency = mapBristolToConsistency(bristolType);
        if (consistency) entry.poop_consistency = consistency;
      }
      // Stored as a glass count with an explicit unit, not pre-converted to ml.
      // The unit tag is what lets the report tell these apart from older entries
      // logged in oz/ml, which must keep rendering in the unit they were entered.
      if (waterGlasses > 0) {
        entry.water_intake = waterGlasses;
        entry.water_unit = WATER_UNIT_GLASSES;
      }
      if (fiber !== undefined) {
        entry.fiber_intake = fiber;
        entry.fiber_unit = settings.fiberUnit;
      }
      if (cleanOutNotes.trim()) entry.clean_out_notes = cleanOutNotes.trim();
      if (notes.trim()) entry.notes = notes.trim();

      await saveEntry(entry as any);

      // Read back after the write so the day just saved counts toward the run.
      const saved = await loadEntries();
      const streak = loggingStreak(
        new Set(saved.map((e) => e.date)),
        dateValue
      );
      const milestone = STREAK_MILESTONES.includes(streak)
        ? ` \u2014 ${streak} days in a row of good notes.`
        : "";

      resetForm();
      setToast(`Saved for ${formatToastDate(dateValue)}${milestone}`);
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
          <ScreenHeader title="Daily Log" />

          <Card>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{dateValue}</Text>
            </TouchableOpacity>
            {showDatePicker || Platform.OS === "ios" ? (
              <DateTimePicker
                value={dateStringToDate(dateValue)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            ) : null}
          </Card>

          <Card
            title="Accidents / Leaks"
            titleAccessory={
              <TouchableOpacity
                hitSlop={8}
                onPress={() => showTooltip("Accidents & leaks", GLOSSARY.accidentsLeaks)}
              >
                <InfoIcon />
              </TouchableOpacity>
            }
          >
            <View style={styles.row}>
              <View style={styles.column}>
                <TextField
                  label="Fecal accidents"
                  value={fecalAccidents}
                  onChangeText={setFecalAccidents}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.column}>
                <TextField
                  label="Fecal leaks / smears"
                  value={fecalLeaks}
                  onChangeText={setFecalLeaks}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <TextField
                  label="Urine accidents"
                  value={urineAccidents}
                  onChangeText={setUrineAccidents}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.column}>
                <TextField
                  label="Urine leaks"
                  value={urineLeaks}
                  onChangeText={setUrineLeaks}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Text style={[styles.label, { fontSize: 11, opacity: 0.7, marginTop: 4 }]}>
              Leaks and smears signal the same rectal distension as full accidents. Track all of them — a smear IS an accident.
            </Text>
          </Card>

          <Card
            title="Bowel movements"
            titleAccessory={
              <TouchableOpacity
                hitSlop={8}
                onPress={() => showTooltip("Spontaneous BM", GLOSSARY.spontaneous)}
              >
                <InfoIcon />
              </TouchableOpacity>
            }
          >
            <SegmentedControl options={bmOptions} value={bmType} onChange={setBmType} />
            {bmType !== "none" ? (
              <View style={styles.stack}>
                <TextField
                  label="BM notes (optional)"
                  value={bmNotes}
                  onChangeText={setBmNotes}
                  placeholder="Any details about this BM"
                />
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Bristol Stool Type (optional)</Text>
                  <TouchableOpacity
                    hitSlop={8}
                    onPress={() => showTooltip("Bristol Stool Scale", GLOSSARY.bristol)}
                  >
                    <InfoIcon />
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>Tap to select, tap again to deselect.</Text>
                {bristolDescriptors.map((item) => {
                  const isSelected = bristolType === item.type;
                  return (
                    <TouchableOpacity
                      key={item.type}
                      onPress={() => setBristolType(isSelected ? null : item.type)}
                      style={[styles.bristolRow, isSelected && styles.bristolRowActive]}
                    >
                      <View style={[styles.bristolBadge, isSelected && styles.bristolBadgeActive]}>
                        <Text style={[styles.bristolBadgeText, isSelected && styles.bristolBadgeTextActive]}>
                          {item.type}
                        </Text>
                      </View>
                      <Text style={[styles.bristolDesc, isSelected && styles.bristolDescActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </Card>

          <Card title="Symptoms/Notables">
            <View style={styles.stack}>
              <Text style={styles.label}>Abdominal pain</Text>
              <SegmentedControl
                options={yesNoOptions}
                value={abdominalPain}
                onChange={setAbdominalPain}
              />
            </View>
            <View style={styles.stack}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Withholding behavior</Text>
                <TouchableOpacity
                  hitSlop={8}
                  onPress={() => showTooltip("Withholding", GLOSSARY.withholding)}
                >
                  <InfoIcon />
                </TouchableOpacity>
              </View>
              <SegmentedControl
                options={yesNoOptions}
                value={withholdingBehavior}
                onChange={setWithholdingBehavior}
              />
            </View>
          </Card>

          <Card title="Meds/Protocol">
            <Text style={styles.helperText}>
              Tap to select multiple. “None/Not taken” clears other selections.
            </Text>
            <View style={styles.chipRow}>
              {medsOptions.map((option) => {
                const isActive = medsProtocol.includes(option.value);
                const isOther = option.value === "__other__";
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      if (option.value === "None/Not taken") {
                        setMedsProtocol(isActive ? [] : [option.value]);
                        setMedicationDoses({});
                        return;
                      }
                      setMedsProtocol((prev) => {
                        const withoutNone = prev.filter(
                          (item) => item !== "None/Not taken"
                        );
                        let next;
                        if (withoutNone.includes(option.value)) {
                          next = withoutNone.filter((item) => item !== option.value);
                        } else {
                          next = [...withoutNone, option.value];
                        }
                        setMedicationDoses((prevDoses) => {
                          const updated = { ...prevDoses };
                          Object.keys(updated).forEach((key) => {
                            if (!next.includes(key)) {
                              delete updated[key];
                            }
                          });
                          return updated;
                        });
                        return next;
                      });
                    }}
                    style={[
                      styles.chip,
                      isOther && !isActive && styles.chipOther,
                      isActive && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isOther && !isActive && styles.chipTextOther,
                        isActive && styles.chipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {medsProtocol.includes("__other__") ? (
              <View style={styles.stack}>
                <TextField
                  label="Other med/protocol"
                  value={otherMed}
                  onChangeText={setOtherMed}
                  placeholder="Name the medication or protocol"
                />
                <Text style={styles.helperText}>
                  {"To save this med for next time, add it under Settings \u2192 Custom medications."}
                </Text>
              </View>
            ) : null}
            {medsProtocol.filter((item) => item !== "None/Not taken" && item !== "__other__").length > 0 ? (
              <View style={styles.stack}>
                <Text style={styles.label}>Medication amounts</Text>
                {medsProtocol
                  .filter((item) => item !== "None/Not taken" && item !== "__other__")
                  .map((med) => {
                    const options = medAmountOptions[med] || [];
                    if (!options.length) return null;
                    return (
                      <View key={med} style={styles.stack}>
                        <Text style={styles.subLabel}>{med}</Text>
                        <View style={styles.chipRow}>
                          {options.map((option) => {
                            const isSelected = medicationDoses[med] === option;
                            return (
                              <TouchableOpacity
                                key={`${med}-${option}`}
                                onPress={() =>
                                  setMedicationDoses((prev) => ({
                                    ...prev,
                                    [med]: isSelected ? "" : option,
                                  }))
                                }
                                style={[styles.chip, isSelected && styles.chipActive]}
                              >
                                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                  {option}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
              </View>
            ) : null}
          </Card>

          <Card title="Hydration and diet">
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Glasses of water today</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    onPress={() => setWaterGlasses((n) => Math.max(WATER_MIN, n - 1))}
                    disabled={waterGlasses <= WATER_MIN}
                    accessibilityRole="button"
                    accessibilityLabel="One glass fewer"
                    style={[
                      styles.stepperButton,
                      waterGlasses <= WATER_MIN && styles.stepperButtonDisabled,
                    ]}
                  >
                    <Text style={styles.stepperGlyph}>−</Text>
                  </TouchableOpacity>
                  <Text
                    style={styles.stepperValue}
                    accessibilityLabel={`${waterGlasses} glasses of water`}
                  >
                    {waterGlasses}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setWaterGlasses((n) => Math.min(WATER_MAX, n + 1))}
                    disabled={waterGlasses >= WATER_MAX}
                    accessibilityRole="button"
                    accessibilityLabel="One glass more"
                    style={[
                      styles.stepperButton,
                      waterGlasses >= WATER_MAX && styles.stepperButtonDisabled,
                    ]}
                  >
                    <Text style={styles.stepperGlyph}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.column}>
                <TextField
                  label={`Insoluble Fiber (${settings.fiberUnit})`}
                  labelAccessory={
                    <TouchableOpacity
                      hitSlop={8}
                      onPress={() =>
                        showTooltip("Insoluble Fiber", GLOSSARY.insolubleFiber)
                      }
                    >
                      <InfoIcon />
                    </TouchableOpacity>
                  }
                  value={fiberIntake}
                  onChangeText={setFiberIntake}
                  placeholder="Optional"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.stack}>
              <Text style={styles.label}>Motility foods (optional)</Text>
              <Text style={styles.helperText}>
                Tap a food to log it. Tap the {"\u24D8"} icon for why it helps.
              </Text>
              <View style={styles.chipRow}>
                {foodOptions.map((option) => {
                  const isActive = dietItems.includes(option.value);
                  const isOther = option.value === "__other_food__";
                  return (
                    <View
                      key={option.value}
                      style={[
                        styles.dietChip,
                        isOther && !isActive && styles.chipOther,
                        isActive && styles.dietChipActive,
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          setDietItems((prev) =>
                            prev.includes(option.value)
                              ? prev.filter((item) => item !== option.value)
                              : [...prev, option.value]
                          );
                        }}
                        style={styles.dietChipLabel}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isOther && !isActive && styles.chipTextOther,
                            isActive && styles.chipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                      {option.info ? (
                        <TouchableOpacity
                          hitSlop={6}
                          onPress={() => showTooltip(option.label, option.info)}
                          style={styles.dietInfoTouch}
                        >
                          <InfoIcon muted={!isActive} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                })}
              </View>
              {dietItems.includes("__other_food__") ? (
                <View style={styles.stack}>
                  <TextField
                    label="Other food"
                    value={otherFood}
                    onChangeText={setOtherFood}
                    placeholder="Name the food"
                  />
                  <Text style={styles.helperText}>
                    {"To save this food for next time, add it under Settings \u2192 Custom foods."}
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>

          <Card
            title="Clean out"
            titleAccessory={
              <TouchableOpacity
                hitSlop={8}
                onPress={() => showTooltip("Clean out", GLOSSARY.cleanOut)}
              >
                <InfoIcon />
              </TouchableOpacity>
            }
          >
            <SegmentedControl options={yesNoOptions} value={cleanOut} onChange={setCleanOut} />
            {cleanOut === "yes" ? (
              <View style={styles.stack}>
                <TextField
                  label="Clean out notes (optional)"
                  value={cleanOutNotes}
                  onChangeText={setCleanOutNotes}
                  placeholder="Optional notes"
                />
              </View>
            ) : null}
          </Card>

          <Card
            title="Timed sits completed"
            titleAccessory={
              <TouchableOpacity
                hitSlop={8}
                onPress={() => showTooltip("Timed sits", GLOSSARY.timedSits)}
              >
                <InfoIcon />
              </TouchableOpacity>
            }
          >
            <SegmentedControl
              options={yesNoOptions}
              value={timedSits}
              onChange={setTimedSits}
            />
          </Card>

          <Card
            title="Proper sitting position"
            titleAccessory={
              <TouchableOpacity
                hitSlop={8}
                onPress={() =>
                  showTooltip("Proper sitting position", GLOSSARY.properSitting)
                }
              >
                <InfoIcon />
              </TouchableOpacity>
            }
          >
            <SegmentedControl
              options={yesNoOptions}
              value={properSitting}
              onChange={setProperSitting}
            />
          </Card>

          <Card title="Physical activity">
            <Text style={styles.helperText}>
              {"Tap what your child did today. Tap \u25B6 on a core exercise to watch how it\u2019s done \u2014 these strengthen the core and pelvic floor."}
            </Text>
            <View style={styles.chipRow}>
              {activityOptions.map((option) => {
                const isActive = activityTypes.includes(option.value);
                return (
                  <View
                    key={option.value}
                    style={[styles.dietChip, isActive && styles.dietChipActive]}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setActivityTypes((prev) =>
                          prev.includes(option.value)
                            ? prev.filter((item) => item !== option.value)
                            : [...prev, option.value]
                        );
                      }}
                      style={styles.dietChipLabel}
                    >
                      <Text
                        style={[styles.chipText, isActive && styles.chipTextActive]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                    {option.demo ? (
                      <TouchableOpacity
                        hitSlop={6}
                        onPress={() => setDemoExercise(option.demo ?? null)}
                        style={styles.dietInfoTouch}
                      >
                        <Text style={styles.playIcon}>{"\u25B6"}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </View>
            <View style={styles.stack}>
              <Text style={styles.label}>Was it 30 minutes or more?</Text>
              <SegmentedControl
                options={yesNoOptions}
                value={activity30Min}
                onChange={setActivity30Min}
              />
            </View>
          </Card>

          <Card title="Other notes">
            <TextField
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional context for clinicians"
              multiline
            />
          </Card>

          <PrimaryButton
            title="Save daily entry"
            onPress={handleSubmit}
            loading={loading}
          />

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </ScrollView>
        <Toast message={toast} onDismiss={() => setToast(null)} />
        <ExerciseDemo exercise={demoExercise} onClose={() => setDemoExercise(null)} />
        <AppModal
          visible={tooltip !== null}
          title={tooltip?.title ?? ""}
          onClose={() => setTooltip(null)}
          closeLabel="Got it"
        >
          <Text style={styles.tooltipText}>{tooltip?.message}</Text>
        </AppModal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    flex: {
      flex: 1,
    },
    container: {
      padding: t.spacing.gutter,
      paddingBottom: 120,
      gap: t.spacing.cardGap,
    },
    label: {
      ...t.typography.label,
      color: t.colors.textSecondary,
    },
    helperText: {
      ...t.typography.caption,
      color: t.colors.textMuted,
    },
    subLabel: {
      ...t.typography.caption,
      color: t.colors.textSecondary,
    },
    row: {
      flexDirection: "row",
      gap: t.spacing.md,
    },
    column: {
      flex: 1,
      gap: t.spacing.sm,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: t.spacing.sm,
    },
    chip: {
      borderWidth: t.sizing.chipBorderWidth,
      borderColor: t.colors.border,
      borderRadius: t.radii.chip,
      paddingVertical: t.sizing.chipPadV,
      paddingHorizontal: t.sizing.chipPadH,
      backgroundColor: t.colors.inputFill,
      justifyContent: "center",
    },
    chipActive: {
      backgroundColor: t.colors.primaryTint,
      borderColor: t.colors.primary,
    },
    /** "Other…" is an open-ended escape hatch, so its outline is open too. */
    chipOther: {
      borderStyle: "dashed",
      backgroundColor: "transparent",
    },
    chipText: {
      ...t.typography.chipLabel,
      color: t.colors.chipText,
    },
    chipTextActive: {
      ...t.typography.chipLabelSelected,
      color: t.colors.primaryDark,
    },
    chipTextOther: {
      color: t.colors.textMuted,
    },
    stack: {
      gap: t.spacing.sm,
    },
    tooltipText: {
      ...t.typography.body,
      color: t.colors.textSecondary,
    },
    status: {
      ...t.typography.label,
      textAlign: "center",
      color: t.colors.textPrimary,
    },
    bristolRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.md,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radii.input,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.inputFill,
      minHeight: 44,
    },
    bristolRowActive: {
      backgroundColor: t.colors.primaryTint,
      borderColor: t.colors.primary,
    },
    bristolBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: t.colors.border,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    bristolBadgeActive: {
      backgroundColor: t.colors.primary,
    },
    bristolBadgeText: {
      ...t.typography.label,
      fontFamily: t.fontFamily.sansBold,
      color: t.colors.textSecondary,
    },
    bristolBadgeTextActive: {
      color: t.colors.onPrimary,
    },
    bristolDesc: {
      flex: 1,
      ...t.typography.caption,
      color: t.colors.textSecondary,
    },
    bristolDescActive: {
      fontFamily: t.fontFamily.sansMedium,
      color: t.colors.textPrimary,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: t.spacing.sm,
    },
    dateButton: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radii.input,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.md,
      backgroundColor: t.colors.inputFill,
      minHeight: 44,
      justifyContent: "center",
    },
    dateButtonText: {
      ...t.typography.body,
      fontFamily: t.fontFamily.sansMedium,
      color: t.colors.textPrimary,
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.sm,
      marginTop: t.spacing.xs,
    },
    stepperButton: {
      width: 44,
      height: 44,
      borderRadius: t.radii.chip,
      borderWidth: t.sizing.chipBorderWidth,
      borderColor: t.colors.border,
      backgroundColor: t.colors.inputFill,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperButtonDisabled: {
      opacity: 0.4,
    },
    stepperGlyph: {
      ...t.typography.sectionTitle,
      color: t.colors.primary,
    },
    stepperValue: {
      ...t.typography.sectionTitle,
      color: t.colors.textPrimary,
      minWidth: 32,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
    dietChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.sm,
      borderWidth: t.sizing.chipBorderWidth,
      borderColor: t.colors.border,
      borderRadius: t.radii.chip,
      paddingVertical: t.sizing.chipPadV,
      paddingHorizontal: t.sizing.chipPadH,
      backgroundColor: t.colors.inputFill,
    },
    dietChipActive: {
      backgroundColor: t.colors.primaryTint,
      borderColor: t.colors.primary,
    },
    dietChipLabel: {
      paddingVertical: 2,
    },
    dietInfoTouch: {
      paddingHorizontal: 2,
      paddingVertical: 2,
    },
    /** "Watch the demo" affordance on an exercise chip. */
    playIcon: {
      ...t.typography.caption,
      fontSize: 11,
      color: t.colors.primary,
    },
  });