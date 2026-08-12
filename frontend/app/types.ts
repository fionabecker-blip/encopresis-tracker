export const entryFields = [
  "id",
  "date",
  "fecal_accidents",
  "urine_accidents",
  "leaks",
  "leak_type",
  "medication",
  "medication_doses",
  "bm_type",
  "bm_notes",
  "poop_consistency",
  "bristol_type",
  "water_intake",
  "fiber_intake",
  "water_unit",
  "fiber_unit",
  "motility_foods",
  "clean_out",
  "clean_out_notes",
  "timed_sits_completed",
  "proper_sitting_position",
  "abdominal_pain",
  "withholding_behavior",
  "activity_30_min",
  "activity_types",
  "notes",
  "created_at",
  "updated_at",
];

export interface Entry {
  id: string;
  date: string;
  fecal_accidents?: number;
  urine_accidents?: number;
  leaks?: boolean;
  leak_type?: "urine" | "fecal" | "both";
  medication?: string[];
  medication_doses?: Record<string, string>;
  bm_type?: string;
  bm_notes?: string;
  poop_consistency?: string;
  bristol_type?: number | null;
  water_intake?: number;
  fiber_intake?: number;
  water_unit?: string;
  fiber_unit?: string;
  motility_foods?: string[];
  clean_out?: boolean;
  clean_out_notes?: string;
  timed_sits_completed?: boolean;
  proper_sitting_position?: boolean;
  abdominal_pain?: boolean;
  withholding_behavior?: boolean;
  activity_30_min?: boolean;
  activity_types?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const settingsDefaults = {
  waterUnit: "oz",
  fiberUnit: "g",
  reminderEnabled: false,
  reminderTime: "20:00",
  notificationId: null,
};

export default function TypesRoute() {
  return null;
}
