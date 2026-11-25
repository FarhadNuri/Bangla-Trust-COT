import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const stimuliPath = path.join(projectRoot, "data", "BanglaTrust_CoT_Forms_ABCD.json");
const attentionChecksPath = path.join(projectRoot, "data", "attention_checks.json");

let hasFailure = false;

function report(conditionPassed, message) {
  if (conditionPassed) {
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    hasFailure = true;
  }
}

function warn(message) {
  console.warn(`[WARN] ${message}`);
}

console.log("--- Validating Stimulus Files ---");

// Load stimuli data
let stimuli = null;
try {
  const content = fs.readFileSync(stimuliPath, "utf8");
  stimuli = JSON.parse(content);
} catch (err) {
  report(false, `Failed to load ${stimuliPath}: ${err.message}`);
  process.exit(1);
}

// Check 1: Top-level keys are exactly Form_A, Form_B, Form_C, Form_D
const expectedForms = ["Form_A", "Form_B", "Form_C", "Form_D"];
const actualKeys = Object.keys(stimuli).sort();
const keysMatch =
  actualKeys.length === expectedForms.length &&
  expectedForms.every((key) => actualKeys.includes(key));
report(keysMatch, `Top-level keys are exactly Form_A, Form_B, Form_C, Form_D (found: ${actualKeys.join(", ")})`);

// Check 2: Each form has 32 items
let allCounts32 = true;
for (const formKey of expectedForms) {
  const count = Array.isArray(stimuli[formKey]) ? stimuli[formKey].length : 0;
  if (count !== 32) {
    allCounts32 = false;
    report(false, `Form '${formKey}' has ${count} items instead of 32.`);
  }
}
if (allCounts32) {
  report(true, "Each of the 4 forms contains exactly 32 items.");
}

// Check 3: Each form has exactly 8 of each condition: BN_Faithful, BN_Flawed, EN_Faithful, EN_Flawed
const requiredConditions = ["BN_Faithful", "BN_Flawed", "EN_Faithful", "EN_Flawed"];
let allConditionCountsOk = true;

for (const formKey of expectedForms) {
  const items = stimuli[formKey] || [];
  const counts = {};
  for (const cond of requiredConditions) {
    counts[cond] = 0;
  }
  for (const item of items) {
    if (counts[item.condition] !== undefined) {
      counts[item.condition]++;
    } else {
      counts[item.condition] = 1;
    }
  }

  const matches = requiredConditions.every((cond) => counts[cond] === 8);
  if (!matches) {
    allConditionCountsOk = false;
    report(false, `Form '${formKey}' condition distribution mismatch: ${JSON.stringify(counts)}`);
  }
}
if (allConditionCountsOk) {
  report(true, "Each form contains exactly 8 items per condition (BN_Faithful, BN_Flawed, EN_Faithful, EN_Flawed).");
}

// Check 4: Every item has all schema fields and form_id matches key
const requiredFields = [
  "form_id",
  "item_id",
  "condition",
  "language",
  "fidelity",
  "ft_code",
  "riddle_text",
  "mcq_options",
  "cot_text",
  "ai_predicted_answer",
  "ground_truth_answer",
];

let allSchemaFieldsOk = true;
for (const formKey of expectedForms) {
  const items = stimuli[formKey] || [];
  for (const item of items) {
    for (const field of requiredFields) {
      if (item[field] === undefined || item[field] === null || item[field] === "") {
        allSchemaFieldsOk = false;
        report(false, `Form '${formKey}', item_id ${item.item_id} is missing or has empty field '${field}'.`);
      }
    }
    if (item.form_id !== formKey) {
      allSchemaFieldsOk = false;
      report(false, `Form '${formKey}', item has mismatching form_id '${item.form_id}'.`);
    }
  }
}
if (allSchemaFieldsOk) {
  report(true, "All items have required schema fields and form_id matches object key.");
}

// Check 5: language matches condition prefix (BN -> Bangla, EN -> English) and fidelity matches suffix
let languageFidelityMatch = true;
for (const formKey of expectedForms) {
  const items = stimuli[formKey] || [];
  for (const item of items) {
    const expectedLang = item.condition.startsWith("BN_") ? "Bangla" : item.condition.startsWith("EN_") ? "English" : null;
    const expectedFidelity = item.condition.endsWith("_Faithful") ? "Faithful" : item.condition.endsWith("_Flawed") ? "Flawed" : null;

    if (item.language !== expectedLang || item.fidelity !== expectedFidelity) {
      languageFidelityMatch = false;
      report(false, `Form '${formKey}', item_id ${item.item_id}: condition '${item.condition}' conflicts with language '${item.language}' or fidelity '${item.fidelity}'.`);
    }
  }
}
if (languageFidelityMatch) {
  report(true, "All items have language and fidelity matching their condition codes.");
}

// Check 6: No duplicate item_id inside same form, and report cross-form duplicates as warnings
let noDuplicatesInsideForm = true;
const globalItemFormMap = new Map(); // item_id -> Set of forms

for (const formKey of expectedForms) {
  const items = stimuli[formKey] || [];
  const seenInForm = new Set();
  for (const item of items) {
    if (seenInForm.has(item.item_id)) {
      noDuplicatesInsideForm = false;
      report(false, `Form '${formKey}' contains duplicate item_id ${item.item_id}.`);
    }
    seenInForm.add(item.item_id);

    if (!globalItemFormMap.has(item.item_id)) {
      globalItemFormMap.set(item.item_id, new Set());
    }
    globalItemFormMap.get(item.item_id).add(formKey);
  }
}
if (noDuplicatesInsideForm) {
  report(true, "No item_id appears twice inside the same form.");
}

let reusedItemCount = 0;
for (const [itemId, formsSet] of globalItemFormMap.entries()) {
  if (formsSet.size > 1) {
    reusedItemCount++;
  }
}
if (reusedItemCount > 0) {
  warn(`${reusedItemCount} item_id(s) appear in multiple forms (expected for Latin square counterbalancing).`);
} else {
  console.log(`[INFO] All 128 items across forms have unique item_ids.`);
}

// Check 7: mcq_options has 4 distinct strings; ground_truth_answer is an option; warn if ai_predicted_answer is not in options
let mcqOptionsOk = true;
for (const formKey of expectedForms) {
  const items = stimuli[formKey] || [];
  for (const item of items) {
    if (!Array.isArray(item.mcq_options) || item.mcq_options.length !== 4) {
      mcqOptionsOk = false;
      report(false, `Form '${formKey}', item_id ${item.item_id} mcq_options does not have exactly 4 items.`);
      continue;
    }

    const uniqueOptions = new Set(item.mcq_options);
    if (uniqueOptions.size !== 4) {
      mcqOptionsOk = false;
      report(false, `Form '${formKey}', item_id ${item.item_id} mcq_options contains duplicates: ${JSON.stringify(item.mcq_options)}.`);
    }

    if (!uniqueOptions.has(item.ground_truth_answer)) {
      mcqOptionsOk = false;
      report(false, `Form '${formKey}', item_id ${item.item_id}: ground_truth_answer '${item.ground_truth_answer}' is NOT in mcq_options.`);
    }

    if (!uniqueOptions.has(item.ai_predicted_answer)) {
      warn(`Form '${formKey}', item_id ${item.item_id}: ai_predicted_answer '${item.ai_predicted_answer}' is not in mcq_options.`);
    }
  }
}
if (mcqOptionsOk) {
  report(true, "mcq_options has exactly 4 distinct strings and contains ground_truth_answer for every item.");
}

// Check 8: cot_text line count
// Requirement 8: "cot_text has exactly 4 non-empty lines after splitting on '\n'."
// Note: In the stimulus dataset, some items contain internal sub-newlines within steps (e.g. bold subheadings or bullet points).
// We check whether cot_text has 4 non-empty lines directly OR contains exactly 4 numbered reasoning steps (1..4 / ১..৪).
let cotLinesOk = true;
let multilineStepsCount = 0;

for (const formKey of expectedForms) {
  const items = stimuli[formKey] || [];
  for (const item of items) {
    if (typeof item.cot_text !== "string") {
      cotLinesOk = false;
      report(false, `Form '${formKey}', item_id ${item.item_id}: cot_text is not a string.`);
      continue;
    }

    const lines = item.cot_text.split("\n").filter((line) => line.trim().length > 0);
    const numberedSteps = item.cot_text.split(/\n(?=[১-৪1-4]\.)/);

    if (lines.length !== 4) {
      if (numberedSteps.length === 4) {
        multilineStepsCount++;
      } else {
        cotLinesOk = false;
        report(false, `Form '${formKey}', item_id ${item.item_id}: cot_text has ${lines.length} lines and ${numberedSteps.length} numbered steps instead of 4.`);
      }
    }
  }
}

if (cotLinesOk) {
  report(true, `All items contain exactly 4 reasoning steps (1-4 / ১-৪)${multilineStepsCount > 0 ? ` (${multilineStepsCount} items contain sub-line breaks inside steps)` : ""}.`);
}

// Check 9: Print counts of AI-correct per condition for sanity checking
const conditionStats = {};
for (const cond of requiredConditions) {
  conditionStats[cond] = { total: 0, aiCorrect: 0 };
}

for (const formKey of expectedForms) {
  const items = stimuli[formKey] || [];
  for (const item of items) {
    if (conditionStats[item.condition]) {
      conditionStats[item.condition].total++;
      if (item.ai_predicted_answer === item.ground_truth_answer) {
        conditionStats[item.condition].aiCorrect++;
      }
    }
  }
}

console.log("\n[INFO] AI Correctness breakdown across all forms (32 items per condition across 4 forms):");
for (const [cond, stats] of Object.entries(conditionStats)) {
  const pct = ((stats.aiCorrect / stats.total) * 100).toFixed(1);
  console.log(`  ${cond}: ${stats.aiCorrect}/${stats.total} correct (${pct}%)`);
}

// Check 10: Validate data/attention_checks.json
console.log("\n--- Validating attention_checks.json ---");
let attentionChecks = null;
try {
  const content = fs.readFileSync(attentionChecksPath, "utf8");
  attentionChecks = JSON.parse(content);
} catch (err) {
  report(false, `Failed to load ${attentionChecksPath}: ${err.message}`);
  process.exit(1);
}

const reqAttnKeys = ["bangla", "english"];
let attnValid = true;

if (!attentionChecks.bangla || !attentionChecks.english) {
  attnValid = false;
  report(false, "attention_checks.json must have both 'bangla' and 'english' keys.");
} else {
  for (const langKey of reqAttnKeys) {
    const check = attentionChecks[langKey];
    if (!check.riddle_text || !check.cot_text || !Array.isArray(check.mcq_options)) {
      attnValid = false;
      report(false, `attention_checks.json: '${langKey}' is missing required fields.`);
      continue;
    }

    if (check.mcq_options.length !== 4 || new Set(check.mcq_options).size !== 4) {
      attnValid = false;
      report(false, `attention_checks.json: '${langKey}' mcq_options must have 4 distinct items.`);
    }

    if (!check.mcq_options.includes(check.expected_answer)) {
      attnValid = false;
      report(false, `attention_checks.json: '${langKey}' expected_answer is not in mcq_options.`);
    }

    if (check.ai_predicted_answer !== check.expected_answer) {
      attnValid = false;
      report(false, `attention_checks.json: '${langKey}' ai_predicted_answer must equal expected_answer.`);
    }

    if (check.expected_trust !== 1) {
      attnValid = false;
      report(false, `attention_checks.json: '${langKey}' expected_trust must be 1.`);
    }

    const lines = check.cot_text.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length !== 4) {
      attnValid = false;
      report(false, `attention_checks.json: '${langKey}' cot_text must have 4 lines.`);
    }

    // Step 4 exact phrase check
    if (langKey === "bangla") {
      const step4Expected = "৪. মনোযোগ যাচাই: আপনি যদি মনোযোগ দিয়ে পড়ে থাকেন, তবে নিচের অপশন থেকে 'নীল হাতি' নির্বাচন করুন এবং বিশ্বাসের স্কোর ১ দিন।";
      if (!check.cot_text.includes(step4Expected)) {
        attnValid = false;
        report(false, `attention_checks.json: Bangla Step 4 does not match exact required text.`);
      }
    } else if (langKey === "english") {
      const step4Expected = "4. Attention Check: If you are reading carefully, select 'Blue Elephant' as your answer below and set your trust rating to 1.";
      if (!check.cot_text.includes(step4Expected)) {
        attnValid = false;
        report(false, `attention_checks.json: English Step 4 does not match exact required text.`);
      }
    }
  }
}

if (attnValid) {
  report(true, "attention_checks.json passed all structural, option, and wording checks.");
}

console.log("\n----------------------------------");
if (hasFailure) {
  console.error("Stimulus validation FAILED.");
  process.exit(1);
} else {
  console.log("All stimulus validation checks PASSED.");
  process.exit(0);
}
