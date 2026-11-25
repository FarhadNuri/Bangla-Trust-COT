import test from "node:test";
import assert from "node:assert/strict";
import { randomInt, shuffle, maxRunLength, constrainedShuffle } from "../src/lib/shuffle.js";

test("shuffle: randomInt(5, 12) stays within bounds and covers both min and max over 5,000 calls", () => {
  let sawMin = false;
  let sawMax = false;

  for (let index = 0; index < 5000; index++) {
    const value = randomInt(5, 12);
    assert.ok(value >= 5 && value <= 12, `Value ${value} is outside [5, 12]`);
    if (value === 5) sawMin = true;
    if (value === 12) sawMax = true;
  }

  assert.ok(sawMin, "Did not encounter lower bound 5");
  assert.ok(sawMax, "Did not encounter upper bound 12");
});

test("shuffle: keeps the same elements and does not mutate the input array", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const inputCopy = [...input];

  const shuffled = shuffle(input);

  // Original array remains intact
  assert.deepEqual(input, inputCopy);
  // Returns a new reference
  assert.notEqual(shuffled, input);
  // Preserves element count and sorted contents
  assert.equal(shuffled.length, input.length);
  assert.deepEqual([...shuffled].sort((a, b) => a - b), inputCopy);
});

test("shuffle: maxRunLength computes streak lengths correctly", () => {
  assert.equal(maxRunLength([]), 0);
  assert.equal(maxRunLength(["A"]), 1);

  const keys = ["A", "A", "B", "B", "B", "A"];
  assert.equal(maxRunLength(keys), 3);

  const objects = [
    { type: "X" },
    { type: "X" },
    { type: "X" },
    { type: "Y" },
    { type: "X" },
  ];
  assert.equal(maxRunLength(objects, (item) => item.type), 3);
});

test("shuffle: constrainedShuffle on 8 Faithful + 8 Flawed objects produces maxRun <= 3 over 300 runs", () => {
  const items = [
    ...Array.from({ length: 8 }, (_, id) => ({ id: `F_${id}`, fidelity: "Faithful" })),
    ...Array.from({ length: 8 }, (_, id) => ({ id: `W_${id}`, fidelity: "Flawed" })),
  ];

  for (let run = 0; run < 300; run++) {
    const result = constrainedShuffle(items, (item) => item.fidelity, 3);
    assert.equal(result.length, 16);

    const runLength = maxRunLength(result, (item) => item.fidelity);
    assert.ok(
      runLength <= 3,
      `Run ${run} had maxRunLength ${runLength} which exceeds limit 3`
    );

    // Verify all 16 original elements are present
    const faithfulCount = result.filter((item) => item.fidelity === "Faithful").length;
    const flawedCount = result.filter((item) => item.fidelity === "Flawed").length;
    assert.equal(faithfulCount, 8);
    assert.equal(flawedCount, 8);
  }
});

test("shuffle: constrainedShuffle throws when arrangement is mathematically impossible", () => {
  const impossibleItems = Array.from({ length: 10 }, (_, id) => ({ id, key: "SAME" }));

  assert.throws(
    () => constrainedShuffle(impossibleItems, (item) => item.key, 3, 50),
    /Failed to find an arrangement/
  );
});
