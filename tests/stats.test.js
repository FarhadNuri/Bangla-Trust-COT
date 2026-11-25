import test from "node:test";
import assert from "node:assert/strict";
import {
  median,
  buildCellCounts,
  buildAttentionCounts,
  averageCompletionSeconds,
  findSpeeders,
} from "../src/lib/stats.js";

test("stats: median calculates correct values for empty, odd, and even arrays", () => {
  assert.equal(median([]), null);
  assert.equal(median([5]), 5);
  assert.equal(median([1, 9, 3]), 3);
  assert.equal(median([1, 2, 8, 10]), 5); // (2+8)/2 = 5
  assert.equal(median([10, 20, 30, 40]), 25);
});

test("stats: buildCellCounts always returns all 8 slots in order", () => {
  const participants = [
    { id: 1, status: "COMPLETED" }, // slot 0
    { id: 2, status: "IN_PROGRESS" }, // slot 1
    { id: 9, status: "COMPLETED" }, // slot 0
  ];

  const cells = buildCellCounts(participants);

  assert.equal(cells.length, 8);
  assert.equal(cells[0].slot, 0);
  assert.equal(cells[0].form_id, "Form_A");
  assert.equal(cells[0].block_order, "BN_FIRST");
  assert.equal(cells[0].completed, 2);
  assert.equal(cells[0].in_progress, 0);

  assert.equal(cells[1].slot, 1);
  assert.equal(cells[1].completed, 0);
  assert.equal(cells[1].in_progress, 1);

  for (let slot = 2; slot < 8; slot++) {
    assert.equal(cells[slot].slot, slot);
    assert.equal(cells[slot].completed, 0);
    assert.equal(cells[slot].in_progress, 0);
  }
});

test("stats: buildAttentionCounts tallies only COMPLETED participants", () => {
  const participants = [
    { status: "COMPLETED", attention_checks_passed: 2 },
    { status: "COMPLETED", attention_checks_passed: 2 },
    { status: "COMPLETED", attention_checks_passed: 1 },
    { status: "IN_PROGRESS", attention_checks_passed: 2 }, // MUST BE IGNORED
  ];

  const counts = buildAttentionCounts(participants);
  assert.deepEqual(counts, { "0": 0, "1": 1, "2": 2 });
});

test("stats: averageCompletionSeconds calculates mean duration", () => {
  const participants = [
    {
      status: "COMPLETED",
      started_at: "2026-11-25T00:00:00Z",
      completed_at: "2026-11-25T00:10:00Z", // 600s
    },
    {
      status: "COMPLETED",
      started_at: "2026-11-25T00:00:00Z",
      completed_at: "2026-11-25T00:20:00Z", // 1200s
    },
    {
      status: "IN_PROGRESS",
      started_at: "2026-11-25T00:00:00Z",
      completed_at: null,
    },
  ];

  const avg = averageCompletionSeconds(participants);
  assert.equal(avg, 900); // (600 + 1200) / 2
});

test("stats: findSpeeders excludes attention checks and catches participants with median RT < threshold", () => {
  const participants = [
    { participant_uuid: "11111111-0000-0000-0000-000000000000", status: "COMPLETED" },
    { participant_uuid: "22222222-0000-0000-0000-000000000000", status: "IN_PROGRESS" },
    { participant_uuid: "33333333-0000-0000-0000-000000000000", status: "COMPLETED" },
  ];

  const responses = [
    // Participant 1: real RTs: [3000, 4000] -> median 3500 (< 5000: Speeder)
    { participant_uuid: "11111111-0000-0000-0000-000000000000", is_attention_check: false, response_time_ms: 3000 },
    { participant_uuid: "11111111-0000-0000-0000-000000000000", is_attention_check: false, response_time_ms: 4000 },
    { participant_uuid: "11111111-0000-0000-0000-000000000000", is_attention_check: true, response_time_ms: 20000 }, // Ignored

    // Participant 2: real RTs: [2000] -> median 2000 (< 5000: Speeder)
    { participant_uuid: "22222222-0000-0000-0000-000000000000", is_attention_check: false, response_time_ms: 2000 },

    // Participant 3: real RTs: [6000, 7000] -> median 6500 (>= 5000: Not speeder)
    { participant_uuid: "33333333-0000-0000-0000-000000000000", is_attention_check: false, response_time_ms: 6000 },
    { participant_uuid: "33333333-0000-0000-0000-000000000000", is_attention_check: false, response_time_ms: 7000 },
  ];

  const speeders = findSpeeders(participants, responses, 5000);

  assert.equal(speeders.length, 2);
  assert.equal(speeders[0].participant_short_id, "11111111");
  assert.equal(speeders[0].median_response_ms, 3500);

  assert.equal(speeders[1].participant_short_id, "22222222");
  assert.equal(speeders[1].median_response_ms, 2000);
});
