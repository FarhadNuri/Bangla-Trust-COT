// Shared constants used across client components and server route handlers.
// Safe for public import (contains NO secrets or database references).

export const GENDERS = [
  "Male",
  "Female",
];

export const NATIVE_LANGUAGES = [
  "Bangla",
  "English",
  "Other",
];

export const EDUCATION_MEDIUMS = [
  "Bangla Medium",
  "English Version",
  "English Medium",
  "Other",
];

export const AI_USAGE_OPTIONS = [
  "Never",
  "Rarely (few times a year)",
  "Monthly",
  "Weekly",
  "Daily",
];

export const FLAW_CATEGORIES = [
  {
    value: "INTRINSIC_CONTRADICTION",
    label: "Contradicted clues stated in the riddle",
  },
  {
    value: "EXTRINSIC_HALLUCINATION",
    label: "Stated a false fact about the object/world",
  },
  {
    value: "REASONING_LEAP",
    label: "Conclusion did not follow from the steps",
  },
];

// Study design parameters and constraints
export const TOTAL_TRIALS = 34;
export const TRIALS_PER_BLOCK = 17;
export const SPEEDER_THRESHOLD_MS = 5000;
export const MAX_FLAW_NOTE_LENGTH = 200;
export const MAX_NAME_LENGTH = 100;
export const MAX_RESPONSE_TIME_MS = 86400000; // 24 hours in ms
