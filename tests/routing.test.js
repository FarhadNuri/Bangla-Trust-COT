import test from "node:test";
import assert from "node:assert/strict";
import { SLOTS, getSlot, getAssignment } from "../src/lib/routing.js";

test("routing: ids 1..8 give exactly the slot table rows in order", () => {
  for (let id = 1; id <= 8; id++) {
    const expectedSlot = id - 1;
    assert.equal(getSlot(id), expectedSlot);

    const assignment = getAssignment(id);
    assert.equal(assignment.slot, expectedSlot);
    assert.equal(assignment.form_id, SLOTS[expectedSlot].form_id);
    assert.equal(assignment.block_order, SLOTS[expectedSlot].block_order);
  }
});

test("routing: id 9 gives the same slot as id 1, id 16 same as id 8", () => {
  assert.equal(getSlot(9), getSlot(1));
  assert.deepEqual(getAssignment(9), getAssignment(1));

  assert.equal(getSlot(16), getSlot(8));
  assert.deepEqual(getAssignment(16), getAssignment(8));
});

test("routing: ids 1..16 produce 8 distinct (form_id, block_order) pairs, each exactly twice", () => {
  const counts = new Map();

  for (let id = 1; id <= 16; id++) {
    const { form_id, block_order } = getAssignment(id);
    const pairKey = `${form_id}::${block_order}`;
    counts.set(pairKey, (counts.get(pairKey) || 0) + 1);
  }

  assert.equal(counts.size, 8);
  for (const [, count] of counts) {
    assert.equal(count, 2);
  }
});

test("routing: invalid ids throw descriptive Errors", () => {
  const invalidIds = [0, -1, -10, 1.5, NaN, Infinity, "1", null, undefined, {}];

  for (const id of invalidIds) {
    assert.throws(() => getSlot(id), /positive integer/);
    assert.throws(() => getAssignment(id), /positive integer/);
  }
});
