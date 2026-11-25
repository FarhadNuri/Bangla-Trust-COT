import "server-only";
import { summarizeResponses } from "./grading.js";

/**
 * Builds the completion payload for a completed participant session.
 * Shared between GET /api/sessions/:uuid and POST /api/sessions/:uuid/complete.
 *
 * @param {object} participant - Participant DB record
 * @param {Array<object>} responses - Array of TrialResponse records
 * @returns {object} Completion object with code, attention checks passed, and accuracy summary
 */
export function buildCompletionData(participant, responses) {
  const completion_code = participant.participant_uuid.slice(0, 8);
  const summary = summarizeResponses(responses);

  return {
    completion_code,
    attention_checks_passed: participant.attention_checks_passed,
    summary,
  };
}
