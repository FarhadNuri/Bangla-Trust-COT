import "server-only";

// Import JSON files on the server only.
// This ensures that ground-truth answers, fidelity labels, and condition codes
// are never bundled into client-side JavaScript or sent across the network.
import stimuliData from "../../data/BanglaTrust_CoT_Forms_ABCD.json" with { type: "json" };
import attentionChecksData from "../../data/attention_checks.json" with { type: "json" };

/**
 * Returns the 32 items for a specific form (Form_A, Form_B, Form_C, Form_D).
 * Throws a descriptive error if the form is unknown or item count is not exactly 32.
 *
 * @param {string} formId - e.g. "Form_A"
 * @returns {Array<object>}
 */
export function getFormItems(formId) {
  if (!formId || typeof formId !== "string") {
    throw new Error(`getFormItems: formId must be a non-empty string, received: ${formId}`);
  }

  const items = stimuliData[formId];

  if (!items || !Array.isArray(items)) {
    throw new Error(`getFormItems: Unknown formId '${formId}'. Expected one of: Form_A, Form_B, Form_C, Form_D.`);
  }

  if (items.length !== 32) {
    throw new Error(`getFormItems: Form '${formId}' must contain exactly 32 items, but has ${items.length}.`);
  }

  return items;
}

/**
 * Returns attention check definitions for Bangla and English blocks.
 *
 * @returns {{ bangla: object, english: object }}
 */
export function getAttentionChecks() {
  const { bangla, english } = attentionChecksData;

  if (!bangla || !english) {
    throw new Error("getAttentionChecks: attention_checks.json must contain both 'bangla' and 'english' definitions.");
  }

  return { bangla, english };
}
