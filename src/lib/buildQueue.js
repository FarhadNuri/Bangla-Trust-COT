import { randomInt, shuffle, constrainedShuffle } from "./shuffle.js";

/**
 * Builds the complete 34-trial experimental queue for a participant.
 * Implements docs/02_ARCHITECTURE.md section 7.
 *
 * Algorithm:
 * 1. Validates formItems (must have 16 Bangla and 16 English items).
 * 2. For each language block of 16 items:
 *    a. Performs a constrained shuffle by fidelity (max run length <= 3).
 *    b. Assigns shuffled presented_options for each riddle.
 *    c. Randomly inserts the attention check at index 5..12 (inclusive) via splice.
 * 3. Joins the blocks according to blockOrder (BN_FIRST or EN_FIRST).
 * 4. Assigns trial_index (1..34) and block_number (1..17 -> 1, 18..34 -> 2).
 *
 * @param {Array<object>} formItems - 32 items from the assigned form
 * @param {string} blockOrder - "BN_FIRST" or "EN_FIRST"
 * @param {{ bangla: object, english: object }} attentionChecks - Attention check templates
 * @returns {Array<object>} 34 full trial objects for the server assigned_queue
 */
export function buildQueue(formItems, blockOrder, attentionChecks) {
  if (!Array.isArray(formItems)) {
    throw new Error("buildQueue: formItems must be an array");
  }

  if (blockOrder !== "BN_FIRST" && blockOrder !== "EN_FIRST") {
    throw new Error(
      `buildQueue: Invalid blockOrder '${blockOrder}'. Expected 'BN_FIRST' or 'EN_FIRST'.`
    );
  }

  if (!attentionChecks || !attentionChecks.bangla || !attentionChecks.english) {
    throw new Error(
      "buildQueue: attentionChecks must contain both 'bangla' and 'english' definitions."
    );
  }

  // 1. Separate into Bangla and English items without mutating inputs
  const banglaItems = formItems.filter((item) => item.language === "Bangla");
  const englishItems = formItems.filter((item) => item.language === "English");

  if (banglaItems.length !== 16 || englishItems.length !== 16) {
    throw new Error(
      `buildQueue: formItems must contain exactly 16 Bangla and 16 English items (found: ${banglaItems.length} Bangla, ${englishItems.length} English).`
    );
  }

  /**
   * Prepares a block of 17 trials:
   * 16 riddles constrained by fidelity run <= 3, plus 1 attention check inserted at index 5..12.
   *
   * @param {Array<object>} items - 16 items of a single language
   * @param {object} attnCheck - Attention check definition for this language
   * @returns {Array<object>} 17-item trial block
   */
  function prepareBlock(items, attnCheck) {
    // Shuffles items with fidelity run constraint
    const shuffledItems = constrainedShuffle(items, (item) => item.fidelity, 3);

    // Transform each riddle item, creating a new object with shuffled options
    const blockTrials = shuffledItems.map((item) => ({
      is_attention_check: false,
      item_id: item.item_id,
      condition: item.condition,
      language: item.language,
      fidelity: item.fidelity,
      ft_code: item.ft_code,
      riddle_text: item.riddle_text,
      cot_text: item.cot_text,
      ai_predicted_answer: item.ai_predicted_answer,
      ground_truth_answer: item.ground_truth_answer,
      presented_options: shuffle(item.mcq_options),
      expected_trust: null,
    }));

    // Prepare attention check trial object
    const attnTrial = {
      is_attention_check: true,
      item_id: attnCheck.item_id,
      condition: "ATTN_CHECK",
      fidelity: "ATTN",
      ft_code: "NONE",
      language: attnCheck.language,
      riddle_text: attnCheck.riddle_text,
      cot_text: attnCheck.cot_text,
      ai_predicted_answer: attnCheck.ai_predicted_answer,
      ground_truth_answer: attnCheck.expected_answer,
      presented_options: shuffle(attnCheck.mcq_options),
      expected_trust: attnCheck.expected_trust ?? 1,
    };

    // Insert attention check at random index between 5 and 12 (inclusive)
    const insertIndex = randomInt(5, 12);
    blockTrials.splice(insertIndex, 0, attnTrial);

    return blockTrials;
  }

  const banglaBlock = prepareBlock(banglaItems, attentionChecks.bangla);
  const englishBlock = prepareBlock(englishItems, attentionChecks.english);

  const orderedBlocks =
    blockOrder === "BN_FIRST"
      ? [banglaBlock, englishBlock]
      : [englishBlock, banglaBlock];

  // Flatten into a 34-item queue with sequential indexing and block numbers
  const queue = [];
  let trialIndex = 1;

  for (let blockIndex = 0; blockIndex < orderedBlocks.length; blockIndex++) {
    const blockNumber = blockIndex + 1;
    const block = orderedBlocks[blockIndex];

    for (let itemIdx = 0; itemIdx < block.length; itemIdx++) {
      const trial = block[itemIdx];
      queue.push({
        trial_index: trialIndex,
        block_number: blockNumber,
        is_attention_check: trial.is_attention_check,
        item_id: trial.item_id,
        condition: trial.condition,
        language: trial.language,
        fidelity: trial.fidelity,
        ft_code: trial.ft_code,
        riddle_text: trial.riddle_text,
        cot_text: trial.cot_text,
        ai_predicted_answer: trial.ai_predicted_answer,
        ground_truth_answer: trial.ground_truth_answer,
        presented_options: trial.presented_options,
        expected_trust: trial.expected_trust,
      });
      trialIndex++;
    }
  }

  return queue;
}
