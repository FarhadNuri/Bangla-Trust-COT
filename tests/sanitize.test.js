import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeTrials } from "../src/lib/sanitize.js";
import { buildQueue } from "../src/lib/buildQueue.js";
import { createFakeForm } from "./helpers/fakeForm.js";

test("sanitizeTrials: every output object contains EXACTLY the 7 allowed keys", () => {
  const { items, attentionChecks } = createFakeForm("Form_A");
  const queue = buildQueue(items, "BN_FIRST", attentionChecks);

  const sanitized = sanitizeTrials(queue);
  assert.equal(sanitized.length, 34);

  const allowedKeys = [
    "trial_index",
    "block_number",
    "language",
    "riddle_text",
    "cot_text",
    "ai_predicted_answer",
    "mcq_options",
  ].sort();

  for (const trial of sanitized) {
    const keys = Object.keys(trial).sort();
    assert.deepEqual(keys, allowedKeys);
    assert.equal(trial.mcq_options.length, 4);
  }
});

test("sanitizeTrials: JSON output does NOT leak any private or experimental fields", () => {
  const { items, attentionChecks } = createFakeForm("Form_A");
  const queue = buildQueue(items, "BN_FIRST", attentionChecks);

  const sanitized = sanitizeTrials(queue);
  const jsonString = JSON.stringify(sanitized);

  const forbiddenKeys = [
    "ground_truth_answer",
    "fidelity",
    "condition",
    "ft_code",
    "item_id",
    "is_attention_check",
    "expected_trust",
  ];

  for (const key of forbiddenKeys) {
    // Check that none of the forbidden keys appear as JSON object keys (e.g. "key":)
    assert.ok(
      !jsonString.includes(`"${key}":`),
      `Sanitized output leaked forbidden key: ${key}`
    );
  }
});
