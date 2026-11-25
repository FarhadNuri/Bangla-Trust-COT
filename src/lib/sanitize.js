/**
 * Sanitizes an array of queue items for safe transmission to the client browser.
 *
 * SECURITY & EXPERIMENT VALIDITY (CRITICAL):
 * We strictly construct each sanitized trial object field-by-field using an EXPLICIT ALLOW-LIST.
 * We NEVER use a deny-list (e.g. deleting keys from a clone) because:
 * 1. Future server-side trial properties or metrics could accidentally leak if not explicitly blocked.
 * 2. Revealing ground_truth_answer, fidelity, condition, ft_code, item_id, is_attention_check,
 *    or expected_trust would allow participants to inspect network payloads and know which items
 *    are flawed, completely compromising the thesis experiment's scientific validity.
 *
 * @param {Array<object>} queue - Full trials from assigned_queue
 * @returns {Array<object>} Browser-safe trials containing ONLY the 7 allowed keys
 */
export function sanitizeTrials(queue) {
  if (!Array.isArray(queue)) {
    throw new Error("sanitizeTrials: queue must be an array");
  }

  return queue.map((trial) => ({
    trial_index: trial.trial_index,
    block_number: trial.block_number,
    language: trial.language,
    riddle_text: trial.riddle_text,
    cot_text: trial.cot_text,
    ai_predicted_answer: trial.ai_predicted_answer,
    mcq_options: trial.presented_options,
  }));
}
