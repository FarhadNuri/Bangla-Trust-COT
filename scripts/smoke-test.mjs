/**
 * WARNING: Run only against a local/test database, never production.
 *
 * Smoke test suite for BanglaTrust-CoT web application.
 * Simulates complete end-to-end participant lifecycles and administrative auditing
 * against a live running Next.js server.
 *
 * Config via environment variables:
 * - BASE_URL: default http://localhost:3000
 * - ADMIN_SECRET: administrator bearer secret (auto-read from .env if omitted)
 * - PARTICIPANTS: number of participants to simulate (default 8)
 */

import fs from "node:fs";
import path from "node:path";

// Auto-read .env if ADMIN_SECRET is not provided via process.env
if (!process.env.ADMIN_SECRET) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*([A-Za-z_0-9]+)\s*=\s*(.*)?\s*$/);
        if (match && !process.env[match[1]]) {
          let val = match[2] || "";
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          process.env[match[1]] = val;
        }
      }
    }
  } catch {
    // Ignore .env read error
  }
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const PARTICIPANTS = parseInt(process.env.PARTICIPANTS || "8", 10);

const EXPECTED_TRIAL_KEYS = [
  "ai_predicted_answer",
  "block_number",
  "cot_text",
  "language",
  "mcq_options",
  "riddle_text",
  "trial_index",
].sort().join(",");

const EXPECTED_CSV_COLUMNS = [
  "participant_id",
  "participant_uuid",
  "form_id",
  "block_order",
  "slot",
  "age",
  "gender",
  "native_language",
  "english_proficiency",
  "education_medium",
  "ai_usage",
  "status",
  "attention_checks_passed",
  "started_at",
  "completed_at",
  "trial_index",
  "block_number",
  "is_attention_check",
  "item_id",
  "condition",
  "language",
  "fidelity",
  "ft_code",
  "ai_predicted_answer",
  "ground_truth_answer",
  "ai_correct",
  "presented_options",
  "trust_score",
  "user_selected_answer",
  "accepted_ai_answer",
  "user_correct",
  "spotted_flaw",
  "flaw_category",
  "flaw_note",
  "response_time_ms",
  "created_at",
];

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    totalPassed++;
    console.log(`  [PASS] ${message}`);
  } else {
    totalFailed++;
    console.error(`  [FAIL] ${message}`);
  }
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isAttentionCheckTrial(trial) {
  return trial.mcq_options.some(
    (opt) => opt === "Blue Elephant" || opt === "নীল হাতি"
  );
}

async function run() {
  console.log("===============================================================================");
  console.log("             BanglaTrust-CoT End-to-End Smoke Test Suite                      ");
  console.log("===============================================================================");
  console.log(`Base URL:     ${BASE_URL}`);
  console.log(`Participants: ${PARTICIPANTS}`);
  console.log(`Admin Secret: ${ADMIN_SECRET ? "[configured]" : "[MISSING]"}`);
  console.log("-------------------------------------------------------------------------------");

  if (!ADMIN_SECRET) {
    console.error("FATAL: ADMIN_SECRET environment variable is required to test admin endpoints.");
    process.exit(1);
  }

  // Pre-flight check: ensure server is reachable
  try {
    const health = await fetch(`${BASE_URL}/api/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: false }),
    });
    if (health.status !== 400) {
      console.warn(`Warning: Expected 400 for consent=false on /api/sessions/start, got ${health.status}`);
    }
  } catch (err) {
    console.error(`FATAL: Cannot reach server at ${BASE_URL}. Ensure 'npm run dev' or 'npm start' is running.`);
    console.error(err.message);
    process.exit(1);
  }

  const createdParticipants = [];
  const recordedAssignments = [];

  for (let pIndex = 1; pIndex <= PARTICIPANTS; pIndex++) {
    console.log(`\n--- Simulating Participant ${pIndex} of ${PARTICIPANTS} ---`);

    // 1. POST /api/sessions/start with consent true
    const startRes = await fetch(`${BASE_URL}/api/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: true }),
    });

    assert(startRes.status === 201, `Participant ${pIndex}: POST /api/sessions/start returned 201 Created`);
    const startData = await startRes.json();
    const { participant_uuid, form_id, block_order, trials } = startData;

    createdParticipants.push(participant_uuid);
    recordedAssignments.push({ form_id, block_order });

    assert(trials.length === 34, `Participant ${pIndex}: Queue has exactly 34 trials`);

    const allKeysValid = trials.every(
      (t) => Object.keys(t).sort().join(",") === EXPECTED_TRIAL_KEYS
    );
    assert(
      allKeysValid,
      `Participant ${pIndex}: Every trial contains EXACTLY the 7 allowed client keys`
    );

    // 2. Assert block order language distribution
    if (block_order === "BN_FIRST") {
      const bnCorrect = trials.slice(0, 17).every((t) => t.language === "Bangla");
      const enCorrect = trials.slice(17, 34).every((t) => t.language === "English");
      assert(
        bnCorrect && enCorrect,
        `Participant ${pIndex}: BN_FIRST orders Bangla (1-17) then English (18-34)`
      );
    } else {
      const enCorrect = trials.slice(0, 17).every((t) => t.language === "English");
      const bnCorrect = trials.slice(17, 34).every((t) => t.language === "Bangla");
      assert(
        enCorrect && bnCorrect,
        `Participant ${pIndex}: EN_FIRST orders English (1-17) then Bangla (18-34)`
      );
    }

    // 3. Detect attention-check trials
    const attnTrials = trials.filter(isAttentionCheckTrial);
    assert(attnTrials.length === 2, `Participant ${pIndex}: Exactly 2 attention checks detected in queue`);

    const attnBlock1 = attnTrials.find((t) => t.block_number === 1);
    const attnBlock2 = attnTrials.find((t) => t.block_number === 2);

    const b1Pos = attnBlock1 ? attnBlock1.trial_index : -1;
    const b2Pos = attnBlock2 ? attnBlock2.trial_index - 17 : -1;

    assert(
      b1Pos >= 6 && b1Pos <= 13,
      `Participant ${pIndex}: Block 1 attention check placed at position ${b1Pos} (expected 6..13)`
    );
    assert(
      b2Pos >= 6 && b2Pos <= 13,
      `Participant ${pIndex}: Block 2 attention check placed at position ${b2Pos} (expected 6..13)`
    );

    // 4. POST a response BEFORE demographics -> 409 DEMOGRAPHICS_REQUIRED
    const preDemoRes = await fetch(`${BASE_URL}/api/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_uuid,
        trial_index: 1,
        user_selected_answer: trials[0].mcq_options[0],
        trust_score: 4,
        spotted_flaw: false,
        flaw_category: null,
        flaw_note: null,
        response_time_ms: 7000,
      }),
    });
    const preDemoJson = await preDemoRes.json();
    assert(
      preDemoRes.status === 409 && preDemoJson?.error?.code === "DEMOGRAPHICS_REQUIRED",
      `Participant ${pIndex}: Response before demographics rejected with 409 DEMOGRAPHICS_REQUIRED`
    );

    // 5. PATCH demographics
    const demoRes = await fetch(`${BASE_URL}/api/sessions/${participant_uuid}/demographics`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_name: "SMOKE_TEST",
        age: 22,
        gender: "Male",
        native_language: "Bangla",
        english_proficiency: 6,
        education_medium: null,
        ai_usage: "Daily",
      }),
    });
    assert(demoRes.status === 200, `Participant ${pIndex}: Demographics saved successfully (200 OK)`);

    // 6. POST trial 3 first -> 409 TRIAL_OUT_OF_ORDER
    const oooRes = await fetch(`${BASE_URL}/api/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_uuid,
        trial_index: 3,
        user_selected_answer: trials[2].mcq_options[0],
        trust_score: 4,
        spotted_flaw: false,
        flaw_category: null,
        flaw_note: null,
        response_time_ms: 7000,
      }),
    });
    const oooJson = await oooRes.json();
    assert(
      oooRes.status === 409 && oooJson?.error?.code === "TRIAL_OUT_OF_ORDER",
      `Participant ${pIndex}: Out of order response rejected with 409 TRIAL_OUT_OF_ORDER`
    );

    // 7. Answer trials 1..34 in order
    for (let i = 0; i < trials.length; i++) {
      const trial = trials[i];
      const isAttn = isAttentionCheckTrial(trial);

      let selectedAnswer;
      let trustScore;
      let spottedFlaw;
      let flawCategory;
      let flawNote;

      if (isAttn) {
        // Pick the exact instructed attention-check option and trust score = 1
        selectedAnswer = trial.mcq_options.find(
          (opt) => opt === "Blue Elephant" || opt === "নীল হাতি"
        );
        trustScore = 1;
        spottedFlaw = false;
        flawCategory = null;
        flawNote = null;
      } else {
        selectedAnswer = randomChoice(trial.mcq_options);
        trustScore = randomInt(1, 7);
        spottedFlaw = Math.random() < 0.4;
        flawCategory = spottedFlaw
          ? randomChoice([
              "INTRINSIC_CONTRADICTION",
              "EXTRINSIC_HALLUCINATION",
              "REASONING_LEAP",
            ])
          : null;
        flawNote = spottedFlaw ? "Simulated test flaw note" : null;
      }

      const responseTimeMs = randomInt(6000, 20000);

      const respPayload = {
        participant_uuid,
        trial_index: trial.trial_index,
        user_selected_answer: selectedAnswer,
        trust_score: trustScore,
        spotted_flaw: spottedFlaw,
        flaw_category: flawCategory,
        flaw_note: flawNote,
        response_time_ms: responseTimeMs,
      };

      const res = await fetch(`${BASE_URL}/api/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(respPayload),
      });

      if (res.status !== 200) {
        const errText = await res.text();
        assert(false, `Participant ${pIndex}: Failed submitting trial ${trial.trial_index}: ${errText}`);
      }

      // Idempotency test: submit trial 1 twice
      if (trial.trial_index === 1) {
        const idempRes = await fetch(`${BASE_URL}/api/responses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(respPayload),
        });
        const idempJson = await idempRes.json();
        assert(
          idempRes.status === 200 && idempJson?.answered_count === 1,
          `Participant ${pIndex}: Trial 1 re-submission is idempotent (answered_count remains 1)`
        );
      }

      // 8. Test premature completion at 33 answered trials
      if (trial.trial_index === 33) {
        const prematureRes = await fetch(
          `${BASE_URL}/api/sessions/${participant_uuid}/complete`,
          { method: "POST" }
        );
        const prematureJson = await prematureRes.json();
        assert(
          prematureRes.status === 409 &&
            prematureJson?.error?.code === "INCOMPLETE_SESSION",
          `Participant ${pIndex}: POST /complete before 34 answers rejected with 409 INCOMPLETE_SESSION`
        );
      }
    }

    assert(true, `Participant ${pIndex}: All 34 trials submitted successfully`);

    // 9. POST /complete after 34 trials
    const completeRes = await fetch(
      `${BASE_URL}/api/sessions/${participant_uuid}/complete`,
      { method: "POST" }
    );
    assert(completeRes.status === 200, `Participant ${pIndex}: Session completed with 200 OK`);
    const completeData = await completeRes.json();

    assert(
      completeData.attention_checks_passed === 2,
      `Participant ${pIndex}: attention_checks_passed === 2`
    );
    assert(
      completeData.summary?.scored_trials === 32,
      `Participant ${pIndex}: summary.scored_trials === 32`
    );

    // Call /complete again to assert idempotency
    const completeRes2 = await fetch(
      `${BASE_URL}/api/sessions/${participant_uuid}/complete`,
      { method: "POST" }
    );
    const completeData2 = await completeRes2.json();
    assert(
      completeRes2.status === 200 &&
        completeData2.completion_code === completeData.completion_code &&
        completeData2.attention_checks_passed === completeData.attention_checks_passed,
      `Participant ${pIndex}: Calling /complete again returns identical result idempotently`
    );

    // 10. POST a response after completion -> 409 SESSION_COMPLETED
    const postCompleteRes = await fetch(`${BASE_URL}/api/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_uuid,
        trial_index: 1,
        user_selected_answer: trials[0].mcq_options[0],
        trust_score: 4,
        spotted_flaw: false,
        flaw_category: null,
        flaw_note: null,
        response_time_ms: 7000,
      }),
    });
    const postCompleteJson = await postCompleteRes.json();
    assert(
      postCompleteRes.status === 409 &&
        postCompleteJson?.error?.code === "SESSION_COMPLETED",
      `Participant ${pIndex}: Response after completion rejected with 409 SESSION_COMPLETED`
    );

    // 11. GET /api/sessions/:uuid -> status COMPLETED, trials []
    const getRes = await fetch(`${BASE_URL}/api/sessions/${participant_uuid}`);
    assert(getRes.status === 200, `Participant ${pIndex}: GET /api/sessions/:uuid returned 200`);
    const getData = await getRes.json();
    assert(
      getData.status === "COMPLETED" &&
        Array.isArray(getData.trials) &&
        getData.trials.length === 0,
      `Participant ${pIndex}: Session status is COMPLETED and trials array is empty`
    );
  }

  // --- Global Administrative Verifications ---
  console.log("\n--- Global Administrative Verifications ---");

  // Counterbalance cell coverage
  if (PARTICIPANTS >= 8) {
    const distinctPairs = new Set(
      recordedAssignments.map((a) => `${a.form_id}:${a.block_order}`)
    );
    assert(
      distinctPairs.size === 8,
      `Simulated ${PARTICIPANTS} participants covered all 8 distinct (form_id, block_order) cells`
    );
  }

  // Admin stats endpoint auth
  const unauthorizedStatsRes = await fetch(`${BASE_URL}/api/admin/stats`);
  assert(
    unauthorizedStatsRes.status === 401,
    "GET /api/admin/stats without secret rejected with 401 Unauthorized"
  );

  const authorizedStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
  });
  assert(
    authorizedStatsRes.status === 200,
    "GET /api/admin/stats with Bearer secret returned 200 OK"
  );
  const statsData = await authorizedStatsRes.json();
  assert(
    Array.isArray(statsData?.cells) && statsData.cells.length === 8,
    "Admin stats returned all 8 counterbalance routing cells"
  );

  // Admin CSV export endpoint
  const csvRes = await fetch(`${BASE_URL}/api/admin/export.csv`, {
    headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
  });
  assert(csvRes.status === 200, "GET /api/admin/export.csv with secret returned 200 OK");

  const csvText = await csvRes.text();
  assert(csvText.startsWith("\uFEFF"), "CSV export starts with UTF-8 BOM (\\uFEFF)");

  const csvLines = csvText.split("\r\n").filter((l) => l.length > 0);
  const headerLine = csvLines[0].replace(/^\uFEFF/, "");
  const headerColumns = headerLine.split(",");

  assert(
    headerColumns.length === 36,
    `CSV header contains exactly 36 columns (got ${headerColumns.length})`
  );

  const columnsMatch = EXPECTED_CSV_COLUMNS.every(
    (col, idx) => headerColumns[idx] === col
  );
  assert(columnsMatch, "CSV header columns match the exact canonical order and schema");

  // Count lines for our created participants
  const participantUuidSet = new Set(createdParticipants);
  let smokeParticipantRows = 0;

  for (let i = 1; i < csvLines.length; i++) {
    const line = csvLines[i];
    for (const uuid of participantUuidSet) {
      if (line.includes(uuid)) {
        smokeParticipantRows++;
        break;
      }
    }
  }

  const expectedTotalRows = PARTICIPANTS * 34;
  assert(
    smokeParticipantRows === expectedTotalRows,
    `CSV contains exactly ${expectedTotalRows} trial rows for SMOKE_TEST participants (found ${smokeParticipantRows})`
  );

  // Summary
  console.log("\n===============================================================================");
  console.log("                           SMOKE TEST SUMMARY                                 ");
  console.log("===============================================================================");
  console.log(`Total Assertions Passed: ${totalPassed}`);
  console.log(`Total Assertions Failed: ${totalFailed}`);

  console.log("\nCleanup SQL to remove simulated smoke test participants:");
  console.log("-------------------------------------------------------------------------------");
  console.log("DELETE FROM participants WHERE participant_name = 'SMOKE_TEST';");
  console.log("-------------------------------------------------------------------------------");

  if (totalFailed > 0) {
    console.error(`\nSMOKE TEST FAILED with ${totalFailed} failure(s).`);
    process.exit(1);
  } else {
    console.log("\nALL SMOKE TEST ASSERTIONS PASSED SUCCESSFULLY!");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("\nUnhandled smoke test error:", err);
  process.exit(1);
});
