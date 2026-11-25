import test from "node:test";
import assert from "node:assert/strict";
import { validateDemographics, validateResponseBody } from "../src/lib/validation.js";

const VALID_DEMOGRAPHICS = {
  participant_name: "Farhad",
  age: 22,
  gender: "Male",
  native_language: "Bangla",
  english_proficiency: 5,
  education_medium: null,
  ai_usage: "Weekly",
};

test("validateDemographics: accepts fully valid demographics payload", () => {
  const result = validateDemographics(VALID_DEMOGRAPHICS);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, VALID_DEMOGRAPHICS);
});

test("validateDemographics: age boundaries and types (17 and 100 fail, string '22' fails)", () => {
  // 17 fails (underage)
  const underAge = validateDemographics({ ...VALID_DEMOGRAPHICS, age: 17 });
  assert.equal(underAge.ok, false);
  assert.equal(underAge.error.field, "age");

  // 100 fails
  const overAge = validateDemographics({ ...VALID_DEMOGRAPHICS, age: 100 });
  assert.equal(overAge.ok, false);
  assert.equal(overAge.error.field, "age");

  // string "22" fails (no auto-casting)
  const stringAge = validateDemographics({ ...VALID_DEMOGRAPHICS, age: "22" });
  assert.equal(stringAge.ok, false);
  assert.equal(stringAge.error.field, "age");

  // valid boundaries 18 and 99 pass
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, age: 18 }).ok, true);
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, age: 99 }).ok, true);
});

test("validateDemographics: english_proficiency boundaries (0 and 8 fail)", () => {
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, english_proficiency: 0 }).ok, false);
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, english_proficiency: 8 }).ok, false);
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, english_proficiency: "5" }).ok, false);

  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, english_proficiency: 1 }).ok, true);
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, english_proficiency: 7 }).ok, true);
});

test("validateDemographics: invalid enum values fail", () => {
  // Bad gender (Non-binary / Prefer not to say was removed)
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, gender: "Other" }).ok, false);
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, gender: "Non-binary / Prefer not to say" }).ok, false);
  // Bad native_language (English is now valid, Hindi is invalid)
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, native_language: "Hindi" }).ok, false);
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, native_language: "English" }).ok, true);
  // Bad ai_usage
  assert.equal(validateDemographics({ ...VALID_DEMOGRAPHICS, ai_usage: "Hourly" }).ok, false);
});

test("validateDemographics: empty string participant_name converts to null", () => {
  const resultEmpty = validateDemographics({ ...VALID_DEMOGRAPHICS, participant_name: "" });
  assert.equal(resultEmpty.ok, true);
  assert.equal(resultEmpty.value.participant_name, null);

  const resultSpaces = validateDemographics({ ...VALID_DEMOGRAPHICS, participant_name: "   " });
  assert.equal(resultSpaces.ok, true);
  assert.equal(resultSpaces.value.participant_name, null);

  const resultOmitted = validateDemographics({ ...VALID_DEMOGRAPHICS, participant_name: undefined });
  assert.equal(resultOmitted.ok, true);
  assert.equal(resultOmitted.value.participant_name, null);
});

// --- Response Body Validation ---

const MOCK_TRIAL = {
  trial_index: 3,
  presented_options: ["Option A", "Option B", "Option C", "Option D"],
};

const VALID_RESPONSE = {
  trial_index: 3,
  trust_score: 5,
  user_selected_answer: "Option A",
  spotted_flaw: false,
  response_time_ms: 12500,
};

test("validateResponseBody: accepts valid response body", () => {
  const result = validateResponseBody(VALID_RESPONSE, MOCK_TRIAL);
  assert.equal(result.ok, true);
  assert.equal(result.value.trial_index, 3);
  assert.equal(result.value.trust_score, 5);
  assert.equal(result.value.user_selected_answer, "Option A");
  assert.equal(result.value.spotted_flaw, false);
  assert.equal(result.value.flaw_category, null);
  assert.equal(result.value.flaw_note, null);
  assert.equal(result.value.response_time_ms, 12500);
});

test("validateResponseBody: trust_score boundaries (0 and 8 fail)", () => {
  assert.equal(validateResponseBody({ ...VALID_RESPONSE, trust_score: 0 }, MOCK_TRIAL).ok, false);
  assert.equal(validateResponseBody({ ...VALID_RESPONSE, trust_score: 8 }, MOCK_TRIAL).ok, false);
  assert.equal(validateResponseBody({ ...VALID_RESPONSE, trust_score: "5" }, MOCK_TRIAL).ok, false);

  assert.equal(validateResponseBody({ ...VALID_RESPONSE, trust_score: 1 }, MOCK_TRIAL).ok, true);
  assert.equal(validateResponseBody({ ...VALID_RESPONSE, trust_score: 7 }, MOCK_TRIAL).ok, true);
});

test("validateResponseBody: answer not in presented_options fails", () => {
  const badAnswer = validateResponseBody(
    { ...VALID_RESPONSE, user_selected_answer: "Option Unknown" },
    MOCK_TRIAL
  );
  assert.equal(badAnswer.ok, false);
  assert.equal(badAnswer.error.field, "user_selected_answer");
});

test("validateResponseBody: spotted_flaw true without category fails", () => {
  const missingCat = validateResponseBody(
    { ...VALID_RESPONSE, spotted_flaw: true },
    MOCK_TRIAL
  );
  assert.equal(missingCat.ok, false);
  assert.equal(missingCat.error.field, "flaw_category");
});

test("validateResponseBody: spotted_flaw true with valid category and note passes", () => {
  const validFlawed = validateResponseBody(
    {
      ...VALID_RESPONSE,
      spotted_flaw: true,
      flaw_category: "REASONING_LEAP",
      flaw_note: "Step 3 doesn't match",
    },
    MOCK_TRIAL
  );
  assert.equal(validFlawed.ok, true);
  assert.equal(validFlawed.value.flaw_category, "REASONING_LEAP");
  assert.equal(validFlawed.value.flaw_note, "Step 3 doesn't match");
});

test("validateResponseBody: spotted_flaw false clears any provided flaw_category and flaw_note to null", () => {
  const result = validateResponseBody(
    {
      ...VALID_RESPONSE,
      spotted_flaw: false,
      flaw_category: "REASONING_LEAP",
      flaw_note: "Should be wiped",
    },
    MOCK_TRIAL
  );
  assert.equal(result.ok, true);
  assert.equal(result.value.flaw_category, null);
  assert.equal(result.value.flaw_note, null);
});

test("validateResponseBody: flaw_note over 200 characters fails", () => {
  const longNote = "A".repeat(201);
  const result = validateResponseBody(
    {
      ...VALID_RESPONSE,
      spotted_flaw: true,
      flaw_category: "REASONING_LEAP",
      flaw_note: longNote,
    },
    MOCK_TRIAL
  );
  assert.equal(result.ok, false);
  assert.equal(result.error.field, "flaw_note");
});

test("validateResponseBody: negative response_time_ms fails", () => {
  const negativeRt = validateResponseBody(
    { ...VALID_RESPONSE, response_time_ms: -50 },
    MOCK_TRIAL
  );
  assert.equal(negativeRt.ok, false);
  assert.equal(negativeRt.error.field, "response_time_ms");
});
