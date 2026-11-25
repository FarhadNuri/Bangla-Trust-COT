export const runtime = "nodejs";

import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleUnexpectedError, isValidUuid } from "@/lib/http";
import { validateResponseBody } from "@/lib/validation";
import { gradeAnswer } from "@/lib/grading";
import { TOTAL_TRIALS } from "@/lib/constants";

export async function POST(request) {
  try {
    // 1. Parse JSON body and perform initial format validation
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError("VALIDATION_ERROR", "Invalid JSON in request body");
    }

    if (!body || typeof body !== "object") {
      return jsonError("VALIDATION_ERROR", "Request body must be a JSON object", {
        field: "body",
      });
    }

    const { participant_uuid, trial_index } = body;

    if (!isValidUuid(participant_uuid)) {
      return jsonError("VALIDATION_ERROR", "Invalid participant UUID format", {
        field: "participant_uuid",
      });
    }

    if (
      typeof trial_index !== "number" ||
      !Number.isInteger(trial_index) ||
      trial_index < 1 ||
      trial_index > TOTAL_TRIALS
    ) {
      return jsonError(
        "VALIDATION_ERROR",
        `trial_index must be an integer between 1 and ${TOTAL_TRIALS}`,
        { field: "trial_index" }
      );
    }

    // 2. Load participant record
    const participant = await prisma.participant.findUnique({
      where: { participant_uuid },
    });

    if (!participant) {
      return jsonError("NOT_FOUND", "Participant session not found");
    }

    // 3. Reject if session is already completed
    if (participant.status === "COMPLETED") {
      return jsonError(
        "SESSION_COMPLETED",
        "Cannot submit responses to a completed session"
      );
    }

    // 4. Require demographics before any trial responses are recorded
    if (participant.age === null) {
      return jsonError(
        "DEMOGRAPHICS_REQUIRED",
        "Demographics must be completed before submitting responses"
      );
    }

    // 5. Check order: participants cannot skip ahead (must be <= answered_count + 1)
    const existingCount = await prisma.trialResponse.count({
      where: { participant_uuid },
    });

    if (trial_index > existingCount + 1) {
      return jsonError(
        "TRIAL_OUT_OF_ORDER",
        `Trial ${trial_index} is out of order. Next expected trial is ${existingCount + 1}`,
        { answered_count: existingCount, trial_index }
      );
    }

    // 6. Locate trial within the server-side assigned_queue
    const assignedQueue = Array.isArray(participant.assigned_queue)
      ? participant.assigned_queue
      : [];

    const serverTrial = assignedQueue.find((t) => t.trial_index === trial_index);
    if (!serverTrial) {
      console.error(
        `Corrupt queue on participant ${participant_uuid}: trial_index ${trial_index} missing from assigned_queue.`
      );
      return jsonError(
        "SERVER_ERROR",
        "Server trial record missing from assigned queue"
      );
    }

    // 7. Validate response fields against the server trial
    const validation = validateResponseBody(body, serverTrial);
    if (!validation.ok) {
      return jsonError("VALIDATION_ERROR", validation.error.message, {
        field: validation.error.field,
      });
    }

    const validData = validation.value;

    // 8. Grade response on the server (browser never receives correctness)
    const { accepted_ai_answer, user_correct } = gradeAnswer(
      serverTrial,
      validData.user_selected_answer
    );

    // Prepare complete row taking experiment-sensitive fields strictly from the server trial
    const rowData = {
      participant_uuid,
      trial_index: serverTrial.trial_index,
      block_number: serverTrial.block_number,
      is_attention_check: serverTrial.is_attention_check,
      item_id: serverTrial.item_id,
      condition: serverTrial.condition,
      language: serverTrial.language,
      fidelity: serverTrial.fidelity,
      ft_code: serverTrial.ft_code,
      ai_predicted_answer: serverTrial.ai_predicted_answer,
      ground_truth_answer: serverTrial.ground_truth_answer,
      presented_options: serverTrial.presented_options,
      trust_score: validData.trust_score,
      user_selected_answer: validData.user_selected_answer,
      accepted_ai_answer,
      user_correct,
      spotted_flaw: validData.spotted_flaw,
      flaw_category: validData.flaw_category,
      flaw_note: validData.flaw_note,
      response_time_ms: validData.response_time_ms,
    };

    // IDEMPOTENCY:
    // If a participant experiences a brief network disconnect or latency and clicks retry,
    // an upsert on (participant_uuid, trial_index) safely updates the existing record
    // instead of creating duplicate responses or throwing unique constraint violations.
    await prisma.trialResponse.upsert({
      where: {
        participant_uuid_trial_index: {
          participant_uuid,
          trial_index,
        },
      },
      create: rowData,
      update: rowData,
    });

    // 10. Re-count and return progress without revealing correctness
    const finalAnsweredCount = await prisma.trialResponse.count({
      where: { participant_uuid },
    });

    return jsonOk({
      saved: true,
      answered_count: finalAnsweredCount,
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
