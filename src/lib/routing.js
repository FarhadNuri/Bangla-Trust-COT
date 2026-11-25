// 8-slot deterministic counterbalancing table (from docs/02_ARCHITECTURE.md section 6)
// Combines 4 stimulus forms (A-D) with 2 language block orders (BN_FIRST / EN_FIRST).
export const SLOTS = [
  { form_id: "Form_A", block_order: "BN_FIRST" }, // slot 0
  { form_id: "Form_B", block_order: "EN_FIRST" }, // slot 1
  { form_id: "Form_C", block_order: "BN_FIRST" }, // slot 2
  { form_id: "Form_D", block_order: "EN_FIRST" }, // slot 3
  { form_id: "Form_A", block_order: "EN_FIRST" }, // slot 4
  { form_id: "Form_B", block_order: "BN_FIRST" }, // slot 5
  { form_id: "Form_C", block_order: "EN_FIRST" }, // slot 6
  { form_id: "Form_D", block_order: "BN_FIRST" }, // slot 7
];

/**
 * Computes the zero-indexed slot number (0..7) based on a participant's database ID.
 * Formula: (participantId - 1) % 8
 *
 * @param {number} participantId - Positive integer (e.g. 1, 2, 3...)
 * @returns {number} Slot index between 0 and 7
 */
export function getSlot(participantId) {
  if (
    typeof participantId !== "number" ||
    !Number.isInteger(participantId) ||
    participantId <= 0
  ) {
    throw new Error(
      `getSlot: participantId must be a positive integer, received: ${participantId}`
    );
  }

  return (participantId - 1) % 8;
}

/**
 * Retrieves the slot assignment containing form_id and block_order.
 *
 * @param {number} participantId - Positive integer
 * @returns {{ slot: number, form_id: string, block_order: string }}
 */
export function getAssignment(participantId) {
  const slot = getSlot(participantId);
  const row = SLOTS[slot];

  return {
    slot,
    form_id: row.form_id,
    block_order: row.block_order,
  };
}
