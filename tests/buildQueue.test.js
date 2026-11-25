import test from "node:test";
import assert from "node:assert/strict";
import { buildQueue } from "../src/lib/buildQueue.js";
import { maxRunLength } from "../src/lib/shuffle.js";
import { createFakeForm } from "./helpers/fakeForm.js";

test("buildQueue: generates exactly 34 trials with 1 attention check per block of 17 at indices 5..12 over 300 runs", () => {
  const { items, attentionChecks } = createFakeForm("Form_A");

  for (let run = 0; run < 300; run++) {
    const queue = buildQueue(items, "BN_FIRST", attentionChecks);
    assert.equal(queue.length, 34);

    const block1 = queue.slice(0, 17);
    const block2 = queue.slice(17, 34);

    // Each block must have exactly 1 attention check
    const block1Attn = block1.filter((t) => t.is_attention_check);
    const block2Attn = block2.filter((t) => t.is_attention_check);
    assert.equal(block1Attn.length, 1);
    assert.equal(block2Attn.length, 1);

    // Attention check index within block (0-indexed) must be between 5 and 12 inclusive
    const block1AttnIndex = block1.findIndex((t) => t.is_attention_check);
    const block2AttnIndex = block2.findIndex((t) => t.is_attention_check);
    assert.ok(
      block1AttnIndex >= 5 && block1AttnIndex <= 12,
      `Block 1 attention check at index ${block1AttnIndex} outside [5, 12]`
    );
    assert.ok(
      block2AttnIndex >= 5 && block2AttnIndex <= 12,
      `Block 2 attention check at index ${block2AttnIndex} outside [5, 12]`
    );
  }
});

test("buildQueue: BN_FIRST orders Bangla first (1..17) then English (18..34); EN_FIRST reverses", () => {
  const { items, attentionChecks } = createFakeForm("Form_A");

  // BN_FIRST
  const bnQueue = buildQueue(items, "BN_FIRST", attentionChecks);
  for (let i = 0; i < 17; i++) {
    assert.equal(bnQueue[i].language, "Bangla");
    assert.equal(bnQueue[i].block_number, 1);
    assert.equal(bnQueue[i].trial_index, i + 1);
  }
  for (let i = 17; i < 34; i++) {
    assert.equal(bnQueue[i].language, "English");
    assert.equal(bnQueue[i].block_number, 2);
    assert.equal(bnQueue[i].trial_index, i + 1);
  }

  // EN_FIRST
  const enQueue = buildQueue(items, "EN_FIRST", attentionChecks);
  for (let i = 0; i < 17; i++) {
    assert.equal(enQueue[i].language, "English");
    assert.equal(enQueue[i].block_number, 1);
    assert.equal(enQueue[i].trial_index, i + 1);
  }
  for (let i = 17; i < 34; i++) {
    assert.equal(enQueue[i].language, "Bangla");
    assert.equal(enQueue[i].block_number, 2);
    assert.equal(enQueue[i].trial_index, i + 1);
  }
});

test("buildQueue: each block has 8 Faithful and 8 Flawed real items with maxRun <= 3", () => {
  const { items, attentionChecks } = createFakeForm("Form_A");

  for (let run = 0; run < 100; run++) {
    const queue = buildQueue(items, "BN_FIRST", attentionChecks);

    const block1Real = queue.slice(0, 17).filter((t) => !t.is_attention_check);
    const block2Real = queue.slice(17, 34).filter((t) => !t.is_attention_check);

    assert.equal(block1Real.length, 16);
    assert.equal(block2Real.length, 16);

    const b1Faithful = block1Real.filter((t) => t.fidelity === "Faithful").length;
    const b1Flawed = block1Real.filter((t) => t.fidelity === "Flawed").length;
    assert.equal(b1Faithful, 8);
    assert.equal(b1Flawed, 8);
    assert.ok(maxRunLength(block1Real, (t) => t.fidelity) <= 3);

    const b2Faithful = block2Real.filter((t) => t.fidelity === "Faithful").length;
    const b2Flawed = block2Real.filter((t) => t.fidelity === "Flawed").length;
    assert.equal(b2Faithful, 8);
    assert.equal(b2Flawed, 8);
    assert.ok(maxRunLength(block2Real, (t) => t.fidelity) <= 3);
  }
});

test("buildQueue: presented_options is a permutation of mcq_options and order differs over trials", () => {
  const { items, attentionChecks } = createFakeForm("Form_A");
  const queue = buildQueue(items, "BN_FIRST", attentionChecks);

  let sawReordered = false;

  for (const trial of queue) {
    assert.equal(trial.presented_options.length, 4);
    // Permutation check: sorted arrays match
    const sortedOriginal = [...(items.find((it) => it.item_id === trial.item_id)?.mcq_options || trial.presented_options)].sort();
    const sortedPresented = [...trial.presented_options].sort();
    assert.deepEqual(sortedPresented, sortedOriginal);

    if (JSON.stringify(trial.presented_options) !== JSON.stringify(sortedOriginal)) {
      sawReordered = true;
    }
  }

  assert.ok(sawReordered, "presented_options should not always match the original order");
});

test("buildQueue: input arrays and objects are not mutated", () => {
  const { items, attentionChecks } = createFakeForm("Form_A");
  const itemsSnapshot = JSON.parse(JSON.stringify(items));
  const attnSnapshot = JSON.parse(JSON.stringify(attentionChecks));

  buildQueue(items, "BN_FIRST", attentionChecks);

  assert.deepEqual(items, itemsSnapshot);
  assert.deepEqual(attentionChecks, attnSnapshot);
});

test("buildQueue: throws when input formItems count or language distribution is broken", () => {
  const { items, attentionChecks } = createFakeForm("Form_A");

  // 15 Bangla items instead of 16
  const badItems = items.slice(1);
  assert.throws(
    () => buildQueue(badItems, "BN_FIRST", attentionChecks),
    /must contain exactly 16 Bangla and 16 English items/
  );

  // Invalid blockOrder
  assert.throws(
    () => buildQueue(items, "INVALID_ORDER", attentionChecks),
    /Invalid blockOrder/
  );
});
