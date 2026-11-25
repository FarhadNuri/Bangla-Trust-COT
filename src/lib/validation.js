import {
  GENDERS,
  NATIVE_LANGUAGES,
  EDUCATION_MEDIUMS,
  AI_USAGE_OPTIONS,
  FLAW_CATEGORIES,
  MAX_NAME_LENGTH,
  MAX_FLAW_NOTE_LENGTH,
  MAX_RESPONSE_TIME_MS,
  TOTAL_TRIALS,
} from "./constants.js";

const VALID_FLAW_VALUES = new Set(FLAW_CATEGORIES.map((cat) => cat.value));

/**
 * Validates the request body for PATCH /api/sessions/:uuid/demographics.
 * Implements docs/03_API_CONTRACT.md section 4.
 *
 * @param {any} body
 * @returns {{ ok: true, value: object } | { ok: false, error: { message: string, field: string } }}
 */
export function validateDemographics(body) {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      error: { message: "Request body must be a JSON object", field: "body" },
    };
  }

  // 1. participant_name: optional string, max 100 chars, empty string -> null
  let participantName = null;
  if (body.participant_name !== undefined && body.participant_name !== null) {
    if (typeof body.participant_name !== "string") {
      return {
        ok: false,
        error: { message: "participant_name must be a string", field: "participant_name" },
      };
    }
    const trimmed = body.participant_name.trim();
    if (trimmed.length > MAX_NAME_LENGTH) {
      return {
        ok: false,
        error: {
          message: `participant_name cannot exceed ${MAX_NAME_LENGTH} characters`,
          field: "participant_name",
        },
      };
    }
    participantName = trimmed.length > 0 ? trimmed : null;
  }

  // 2. age: required integer between 18 and 99
  const age = body.age;
  if (age === undefined || age === null) {
    return {
      ok: false,
      error: { message: "age is required", field: "age" },
    };
  }
  if (typeof age !== "number" || !Number.isInteger(age)) {
    return {
      ok: false,
      error: { message: "age must be an integer", field: "age" },
    };
  }
  if (age < 18 || age > 99) {
    return {
      ok: false,
      error: { message: "age must be between 18 and 99", field: "age" },
    };
  }

  // 3. gender: required enum
  const gender = body.gender;
  if (!gender || typeof gender !== "string") {
    return {
      ok: false,
      error: { message: "gender is required", field: "gender" },
    };
  }
  if (!GENDERS.includes(gender)) {
    return {
      ok: false,
      error: {
        message: `gender must be one of: ${GENDERS.join(", ")}`,
        field: "gender",
      },
    };
  }

  // 4. native_language: required enum
  const nativeLanguage = body.native_language;
  if (!nativeLanguage || typeof nativeLanguage !== "string") {
    return {
      ok: false,
      error: { message: "native_language is required", field: "native_language" },
    };
  }
  if (!NATIVE_LANGUAGES.includes(nativeLanguage)) {
    return {
      ok: false,
      error: {
        message: `native_language must be one of: ${NATIVE_LANGUAGES.join(", ")}`,
        field: "native_language",
      },
    };
  }

  // 5. english_proficiency: required integer 1..7
  const englishProficiency = body.english_proficiency;
  if (englishProficiency === undefined || englishProficiency === null) {
    return {
      ok: false,
      error: { message: "english_proficiency is required", field: "english_proficiency" },
    };
  }
  if (typeof englishProficiency !== "number" || !Number.isInteger(englishProficiency)) {
    return {
      ok: false,
      error: {
        message: "english_proficiency must be an integer",
        field: "english_proficiency",
      },
    };
  }
  if (englishProficiency < 1 || englishProficiency > 7) {
    return {
      ok: false,
      error: {
        message: "english_proficiency must be between 1 and 7",
        field: "english_proficiency",
      },
    };
  }

  // 6. education_medium: optional string / null
  const educationMedium =
    body.education_medium !== undefined && body.education_medium !== null && body.education_medium !== ""
      ? String(body.education_medium).trim()
      : null;

  // 7. ai_usage: required enum
  const aiUsage = body.ai_usage;
  if (!aiUsage || typeof aiUsage !== "string") {
    return {
      ok: false,
      error: { message: "ai_usage is required", field: "ai_usage" },
    };
  }
  if (!AI_USAGE_OPTIONS.includes(aiUsage)) {
    return {
      ok: false,
      error: {
        message: `ai_usage must be one of: ${AI_USAGE_OPTIONS.join(", ")}`,
        field: "ai_usage",
      },
    };
  }

  return {
    ok: true,
    value: {
      participant_name: participantName,
      age,
      gender,
      native_language: nativeLanguage,
      english_proficiency: englishProficiency,
      education_medium: educationMedium,
      ai_usage: aiUsage,
    },
  };
}

/**
 * Validates the request body for POST /api/responses against the stored server trial.
 * Implements docs/03_API_CONTRACT.md section 5.
 *
 * @param {any} body - Received request JSON
 * @param {object} trial - Stored trial from assigned_queue
 * @returns {{ ok: true, value: object } | { ok: false, error: { message: string, field: string } }}
 */
export function validateResponseBody(body, trial) {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      error: { message: "Request body must be a JSON object", field: "body" },
    };
  }

  if (!trial || !Array.isArray(trial.presented_options)) {
    return {
      ok: false,
      error: { message: "Stored trial data is invalid or missing options", field: "trial" },
    };
  }

  // 1. trial_index: required integer 1..34 matching trial.trial_index
  const trialIndex = body.trial_index;
  if (trialIndex === undefined || trialIndex === null) {
    return {
      ok: false,
      error: { message: "trial_index is required", field: "trial_index" },
    };
  }
  if (typeof trialIndex !== "number" || !Number.isInteger(trialIndex)) {
    return {
      ok: false,
      error: { message: "trial_index must be an integer", field: "trial_index" },
    };
  }
  if (trialIndex < 1 || trialIndex > TOTAL_TRIALS) {
    return {
      ok: false,
      error: {
        message: `trial_index must be between 1 and ${TOTAL_TRIALS}`,
        field: "trial_index",
      },
    };
  }

  // 2. trust_score: required integer 1..7
  const trustScore = body.trust_score;
  if (trustScore === undefined || trustScore === null) {
    return {
      ok: false,
      error: { message: "trust_score is required", field: "trust_score" },
    };
  }
  if (typeof trustScore !== "number" || !Number.isInteger(trustScore)) {
    return {
      ok: false,
      error: { message: "trust_score must be an integer", field: "trust_score" },
    };
  }
  if (trustScore < 1 || trustScore > 7) {
    return {
      ok: false,
      error: { message: "trust_score must be an integer between 1 and 7", field: "trust_score" },
    };
  }

  // 3. user_selected_answer: required string, must be one of trial.presented_options
  const userSelectedAnswer = body.user_selected_answer;
  if (typeof userSelectedAnswer !== "string") {
    return {
      ok: false,
      error: {
        message: "user_selected_answer must be a string",
        field: "user_selected_answer",
      },
    };
  }
  if (!trial.presented_options.includes(userSelectedAnswer)) {
    return {
      ok: false,
      error: {
        message: "user_selected_answer must be one of the presented options",
        field: "user_selected_answer",
      },
    };
  }

  // 4. spotted_flaw: required boolean
  const spottedFlaw = body.spotted_flaw;
  if (typeof spottedFlaw !== "boolean") {
    return {
      ok: false,
      error: { message: "spotted_flaw must be a boolean", field: "spotted_flaw" },
    };
  }

  // 5. flaw_category & flaw_note logic
  let flawCategory = null;
  let flawNote = null;

  if (spottedFlaw) {
    // When spotted_flaw is true, category is required
    const categoryInput = body.flaw_category;
    if (!categoryInput || typeof categoryInput !== "string") {
      return {
        ok: false,
        error: {
          message: "flaw_category is required when spotted_flaw is true",
          field: "flaw_category",
        },
      };
    }
    if (!VALID_FLAW_VALUES.has(categoryInput)) {
      return {
        ok: false,
        error: {
          message: `flaw_category must be one of: ${Array.from(VALID_FLAW_VALUES).join(", ")}`,
          field: "flaw_category",
        },
      };
    }
    flawCategory = categoryInput;

    // flaw_note is optional string, max 200 chars
    if (body.flaw_note !== undefined && body.flaw_note !== null) {
      if (typeof body.flaw_note !== "string") {
        return {
          ok: false,
          error: { message: "flaw_note must be a string", field: "flaw_note" },
        };
      }
      const trimmedNote = body.flaw_note.trim();
      if (trimmedNote.length > MAX_FLAW_NOTE_LENGTH) {
        return {
          ok: false,
          error: {
            message: `flaw_note cannot exceed ${MAX_FLAW_NOTE_LENGTH} characters`,
            field: "flaw_note",
          },
        };
      }
      flawNote = trimmedNote.length > 0 ? trimmedNote : null;
    }
  } else {
    // When spotted_flaw is false, force both to null regardless of what client sent
    flawCategory = null;
    flawNote = null;
  }

  // 6. response_time_ms: required integer between 0 and 86,400,000
  const responseTimeMs = body.response_time_ms;
  if (responseTimeMs === undefined || responseTimeMs === null) {
    return {
      ok: false,
      error: { message: "response_time_ms is required", field: "response_time_ms" },
    };
  }
  if (typeof responseTimeMs !== "number" || !Number.isInteger(responseTimeMs)) {
    return {
      ok: false,
      error: {
        message: "response_time_ms must be an integer",
        field: "response_time_ms",
      },
    };
  }
  if (responseTimeMs < 0 || responseTimeMs > MAX_RESPONSE_TIME_MS) {
    return {
      ok: false,
      error: {
        message: `response_time_ms must be between 0 and ${MAX_RESPONSE_TIME_MS}`,
        field: "response_time_ms",
      },
    };
  }

  return {
    ok: true,
    value: {
      trial_index: trialIndex,
      trust_score: trustScore,
      user_selected_answer: userSelectedAnswer,
      spotted_flaw: spottedFlaw,
      flaw_category: flawCategory,
      flaw_note: flawNote,
      response_time_ms: responseTimeMs,
    },
  };
}
