import test from "node:test";
import assert from "node:assert/strict";
import { gradeAnswer, didPassAttentionCheck, summarizeResponses } from "../src/lib/grading.js";

test("gradeAnswer: correctly computes accepted_ai_answer and user_correct combinations", () => {
  const trial = {
    ai_predicted_answer: "AI Choice",
    ground_truth_answer: "Truth Choice",
  };

  // Case 1: Picked AI choice (which is incorrect)
  const result1 = gradeAnswer(trial, "AI Choice");
  assert.equal(result1.accepted_ai_answer, true);
  assert.equal(result1.user_correct, false);

  // Case 2: Picked ground truth (disagreed with AI)
  const result2 = gradeAnswer(trial, "Truth Choice");
  assert.equal(result2.accepted_ai_answer, false);
  assert.equal(result2.user_correct, true);

  // Case 3: Picked an unrelated distractor
  const result3 = gradeAnswer(trial, "Distractor Option");
  assert.equal(result3.accepted_ai_answer, false);
  assert.equal(result3.user_correct, false);

  // Case 4: Faithful trial where AI answer === Ground truth, and user agreed
  const faithfulTrial = {
    ai_predicted_answer: "Correct",
    ground_truth_answer: "Correct",
  };
  const result4 = gradeAnswer(faithfulTrial, "Correct");
  assert.equal(result4.accepted_ai_answer, true);
  assert.equal(result4.user_correct, true);
});

test("didPassAttentionCheck: passes only when answer matches ground truth AND trust score is 1", () => {
  const attnTrial = {
    ground_truth_answer: "Blue Elephant",
    expected_trust: 1,
  };

  // Correct answer + trust 1 -> PASS
  assert.equal(didPassAttentionCheck(attnTrial, "Blue Elephant", 1), true);

  // Correct answer + trust 2 -> FAIL
  assert.equal(didPassAttentionCheck(attnTrial, "Blue Elephant", 2), false);

  // Wrong answer + trust 1 -> FAIL
  assert.equal(didPassAttentionCheck(attnTrial, "Red Horse", 1), false);

  // Wrong answer + trust 5 -> FAIL
  assert.equal(didPassAttentionCheck(attnTrial, "Green Tiger", 5), false);
});

test("summarizeResponses: ignores attention checks and aggregates accuracy per language", () => {
  const rows = [
    // 2 Bangla real rows: 1 user correct, both AI correct
    { is_attention_check: false, language: "Bangla", ai_predicted_answer: "A", ground_truth_answer: "A", user_correct: true },
    { is_attention_check: false, language: "Bangla", ai_predicted_answer: "B", ground_truth_answer: "B", user_correct: false },

    // 1 Bangla attention check (MUST BE IGNORED)
    { is_attention_check: true, language: "Bangla", ai_predicted_answer: "Attn", ground_truth_answer: "Attn", user_correct: true },

    // 2 English real rows: 2 user correct, 1 AI correct
    { is_attention_check: false, language: "English", ai_predicted_answer: "X", ground_truth_answer: "X", user_correct: true },
    { is_attention_check: false, language: "English", ai_predicted_answer: "Wrong", ground_truth_answer: "Y", user_correct: true },

    // 1 English attention check (MUST BE IGNORED)
    { is_attention_check: true, language: "English", ai_predicted_answer: "Attn2", ground_truth_answer: "Attn2", user_correct: false },
  ];

  const summary = summarizeResponses(rows);

  assert.equal(summary.scored_trials, 4);
  assert.equal(summary.user_correct_count, 3);
  assert.equal(summary.ai_correct_count, 3);

  assert.deepEqual(summary.by_language, {
    Bangla: { total: 2, user_correct_count: 1, ai_correct_count: 2 },
    English: { total: 2, user_correct_count: 2, ai_correct_count: 1 },
  });
});
