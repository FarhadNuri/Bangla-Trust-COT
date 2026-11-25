/**
 * Grades a participant's selected answer against the stored trial.
 * Strict string equality is used for both AI acceptance and answer correctness.
 *
 * @param {object} trial - Stored trial object containing ai_predicted_answer and ground_truth_answer
 * @param {string} userSelectedAnswer - Selected MCQ option
 * @returns {{ accepted_ai_answer: boolean, user_correct: boolean }}
 */
export function gradeAnswer(trial, userSelectedAnswer) {
  if (!trial) {
    throw new Error("gradeAnswer: trial object is required");
  }

  const accepted_ai_answer = userSelectedAnswer === trial.ai_predicted_answer;
  const user_correct = userSelectedAnswer === trial.ground_truth_answer;

  return { accepted_ai_answer, user_correct };
}

/**
 * Checks whether an attention check trial was successfully passed.
 * An attention check passes ONLY IF:
 * 1. The participant picked the expected ground-truth answer ("Blue Elephant" / "নীল হাতি").
 * 2. The participant selected the requested trust rating (exactly 1).
 *
 * @param {object} trial - Attention check trial with ground_truth_answer and expected_trust
 * @param {string} userSelectedAnswer - Selected answer string
 * @param {number} trustScore - 1..7 Likert scale rating
 * @returns {boolean} True if attention check passed
 */
export function didPassAttentionCheck(trial, userSelectedAnswer, trustScore) {
  if (!trial) {
    throw new Error("didPassAttentionCheck: trial object is required");
  }

  const answerMatches = userSelectedAnswer === trial.ground_truth_answer;
  const expectedTrust = trial.expected_trust ?? 1;
  const trustMatches = trustScore === expectedTrust;

  return answerMatches && trustMatches;
}

/**
 * Summarizes the 32 real experimental responses for the completion payload.
 * Attention-check rows are strictly excluded.
 * Implements docs/03_API_CONTRACT.md section 6 summary format.
 *
 * @param {Array<object>} responseRows - Array of response records
 * @returns {object} Summary object
 */
export function summarizeResponses(responseRows) {
  if (!Array.isArray(responseRows)) {
    throw new Error("summarizeResponses: responseRows must be an array");
  }

  // Strictly filter out attention checks
  const realTrials = responseRows.filter((row) => !row.is_attention_check);

  let totalUserCorrect = 0;
  let totalAiCorrect = 0;

  const byLanguage = {
    Bangla: { total: 0, user_correct_count: 0, ai_correct_count: 0 },
    English: { total: 0, user_correct_count: 0, ai_correct_count: 0 },
  };

  for (const row of realTrials) {
    const isUserCorrect = Boolean(row.user_correct);
    const isAiCorrect = row.ai_predicted_answer === row.ground_truth_answer;

    if (isUserCorrect) {
      totalUserCorrect++;
    }
    if (isAiCorrect) {
      totalAiCorrect++;
    }

    const lang = row.language;
    if (byLanguage[lang]) {
      byLanguage[lang].total++;
      if (isUserCorrect) {
        byLanguage[lang].user_correct_count++;
      }
      if (isAiCorrect) {
        byLanguage[lang].ai_correct_count++;
      }
    }
  }

  return {
    scored_trials: realTrials.length,
    user_correct_count: totalUserCorrect,
    ai_correct_count: totalAiCorrect,
    by_language: byLanguage,
  };
}
