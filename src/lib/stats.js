import { SLOTS, getSlot } from "./routing.js";

/**
 * Calculates the median of an array of numbers.
 * Returns null if the array is empty.
 *
 * @param {Array<number>} numbers
 * @returns {number|null}
 */
export function median(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return null;
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }

  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Builds count statistics across all 8 counterbalancing slots.
 * Always returns exactly 8 cells ordered by slot (0..7), with zeros if empty.
 *
 * @param {Array<object>} participants - Array of participant records with id and status
 * @returns {Array<object>} Array of 8 cell objects: { slot, form_id, block_order, in_progress, completed }
 */
export function buildCellCounts(participants) {
  // Initialize with all 8 slots from the routing table
  const cells = SLOTS.map((slotDef, slotIndex) => ({
    slot: slotIndex,
    form_id: slotDef.form_id,
    block_order: slotDef.block_order,
    in_progress: 0,
    completed: 0,
  }));

  if (!Array.isArray(participants)) {
    return cells;
  }

  for (const p of participants) {
    if (!p.id) continue;
    const slotIndex = getSlot(p.id);
    if (cells[slotIndex]) {
      if (p.status === "COMPLETED") {
        cells[slotIndex].completed++;
      } else {
        cells[slotIndex].in_progress++;
      }
    }
  }

  return cells;
}

/**
 * Returns distribution of passed attention checks for COMPLETED participants only.
 *
 * @param {Array<object>} participants - Array of participant records
 * @returns {{ "0": number, "1": number, "2": number }}
 */
export function buildAttentionCounts(participants) {
  const counts = { "0": 0, "1": 0, "2": 0 };

  if (!Array.isArray(participants)) {
    return counts;
  }

  for (const p of participants) {
    if (p.status === "COMPLETED") {
      const passed = String(p.attention_checks_passed ?? 0);
      if (counts[passed] !== undefined) {
        counts[passed]++;
      }
    }
  }

  return counts;
}

/**
 * Computes average completion time in seconds across completed participants with valid timestamps.
 * Returns null if no completed participants exist.
 *
 * @param {Array<object>} participants - Array of participant records
 * @returns {number|null}
 */
export function averageCompletionSeconds(participants) {
  if (!Array.isArray(participants)) {
    return null;
  }

  const completed = participants.filter(
    (p) => p.status === "COMPLETED" && p.started_at && p.completed_at
  );

  if (completed.length === 0) {
    return null;
  }

  let totalSeconds = 0;
  for (const p of completed) {
    const start = new Date(p.started_at).getTime();
    const end = new Date(p.completed_at).getTime();
    totalSeconds += Math.max(0, (end - start) / 1000);
  }

  return Math.round(totalSeconds / completed.length);
}

/**
 * Identifies speeders: participants whose median response time on real (non-attention)
 * trials is below thresholdMs (typically 5,000 ms).
 * Requires at least 1 real response to be evaluated.
 *
 * @param {Array<object>} participants - Array of participant records
 * @param {Array<object>} responses - Array of response records with response_time_ms and is_attention_check
 * @param {number} [thresholdMs=5000] - Threshold in milliseconds
 * @returns {Array<object>} Array of speeder objects: { participant_short_id, status, median_response_ms }
 */
export function findSpeeders(participants, responses, thresholdMs = 5000) {
  if (!Array.isArray(participants) || !Array.isArray(responses)) {
    return [];
  }

  // Group real (non-attention) response times by participant_uuid
  const responseTimesByUuid = new Map();

  for (const r of responses) {
    if (r.is_attention_check) {
      continue; // Strictly exclude attention checks from speeder calculation
    }
    if (!responseTimesByUuid.has(r.participant_uuid)) {
      responseTimesByUuid.set(r.participant_uuid, []);
    }
    if (typeof r.response_time_ms === "number") {
      responseTimesByUuid.get(r.participant_uuid).push(r.response_time_ms);
    }
  }

  const speeders = [];

  for (const p of participants) {
    const times = responseTimesByUuid.get(p.participant_uuid);
    if (times && times.length > 0) {
      const med = median(times);
      if (med !== null && med < thresholdMs) {
        speeders.push({
          participant_short_id: p.participant_uuid.slice(0, 8),
          status: p.status,
          median_response_ms: med,
        });
      }
    }
  }

  return speeders;
}
