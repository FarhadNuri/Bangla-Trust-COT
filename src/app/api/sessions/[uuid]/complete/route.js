export const runtime = "nodejs";

import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleUnexpectedError, isValidUuid } from "@/lib/http";
import { didPassAttentionCheck } from "@/lib/grading";
import { buildCompletionData } from "@/lib/completion";
import { TOTAL_TRIALS } from "@/lib/constants";

export async function POST(request, { params }) {
  try {
    const { uuid } = await params;

    // 1. Validate uuid format and load participant
    if (!isValidUuid(uuid)) {
      return jsonError("VALIDATION_ERROR", "Invalid participant UUID format", {
        field: "uuid",
      });
    }

    const participant = await prisma.participant.findUnique({
      where: { participant_uuid: uuid },
    });

    if (!participant) {
      return jsonError("NOT_FOUND", "Participant session not found");
    }

    // 2. IDEMPOTENCY:
    // If the participant session is already marked COMPLETED (e.g. from a duplicate click,
    // page refresh, or retry), return the saved completion payload without performing any writes.
    if (participant.status === "COMPLETED") {
      const responses = await prisma.trialResponse.findMany({
        where: { participant_uuid: uuid },
        orderBy: { trial_index: "asc" },
      });
      const completionData = buildCompletionData(participant, responses);
      return jsonOk(completionData);
    }

    // 3. Verify that all 34 trials have been recorded
    const responses = await prisma.trialResponse.findMany({
      where: { participant_uuid: uuid },
      orderBy: { trial_index: "asc" },
    });

    if (responses.length < TOTAL_TRIALS) {
      return jsonError(
        "INCOMPLETE_SESSION",
        `Session is incomplete. ${responses.length} of ${TOTAL_TRIALS} responses recorded.`,
        { answered_count: responses.length, required: TOTAL_TRIALS }
      );
    }

    // 4. Grade attention checks: must have picked ground truth AND rated trust as exactly 1
    const assignedQueue = Array.isArray(participant.assigned_queue)
      ? participant.assigned_queue
      : [];

    let attentionChecksPassed = 0;
    const attentionRows = responses.filter((r) => r.is_attention_check);

    for (const row of attentionRows) {
      const serverTrial = assignedQueue.find((t) => t.trial_index === row.trial_index);
      if (serverTrial) {
        const passed = didPassAttentionCheck(
          serverTrial,
          row.user_selected_answer,
          row.trust_score
        );
        if (passed) {
          attentionChecksPassed++;
        }
      }
    }

    // 5. CONCURRENCY & RACE-CONDITION GUARD:
    // Using updateMany with where { participant_uuid: uuid, status: "IN_PROGRESS" }
    // guarantees atomic transition. If two simultaneous requests arrive, exactly one will update
    // 1 row. The second request gets count = 0, indicating another worker completed it,
    // and safely falls back to returning the completed state.
    const updateResult = await prisma.participant.updateMany({
      where: {
        participant_uuid: uuid,
        status: "IN_PROGRESS",
      },
      data: {
        attention_checks_passed: attentionChecksPassed,
        status: "COMPLETED",
        completed_at: new Date(),
      },
    });

    if (updateResult.count === 0) {
      // Another request completed this session concurrently. Re-read and return saved result.
      const freshParticipant = await prisma.participant.findUnique({
        where: { participant_uuid: uuid },
      });
      const completionData = buildCompletionData(freshParticipant, responses);
      return jsonOk(completionData);
    }

    // 6. Return standard completion response
    const updatedParticipant = {
      ...participant,
      status: "COMPLETED",
      attention_checks_passed: attentionChecksPassed,
    };

    const completionData = buildCompletionData(updatedParticipant, responses);

    return jsonOk(completionData);
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
