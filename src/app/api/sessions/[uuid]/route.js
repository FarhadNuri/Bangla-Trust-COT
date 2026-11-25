export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleUnexpectedError, isValidUuid } from "@/lib/http";
import { sanitizeTrials } from "@/lib/sanitize";
import { buildCompletionData } from "@/lib/completion";

export async function GET(request, { params }) {
  try {
    const { uuid } = await params;

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

    const answeredCount = await prisma.trialResponse.count({
      where: { participant_uuid: uuid },
    });

    const demographicsCompleted = participant.age !== null;
    const demographics = demographicsCompleted
      ? {
          participant_name: participant.participant_name,
          age: participant.age,
          gender: participant.gender,
          native_language: participant.native_language,
          english_proficiency: participant.english_proficiency,
          education_medium: participant.education_medium,
          ai_usage: participant.ai_usage,
        }
      : null;

    if (participant.status === "COMPLETED") {
      const responses = await prisma.trialResponse.findMany({
        where: { participant_uuid: uuid },
        orderBy: { trial_index: "asc" },
      });

      const completion = buildCompletionData(participant, responses);

      return jsonOk({
        participant_uuid: participant.participant_uuid,
        status: participant.status,
        form_id: participant.form_id,
        block_order: participant.block_order,
        demographics_completed: demographicsCompleted,
        demographics,
        answered_count: answeredCount,
        next_trial_index: null,
        trials: [],
        completion,
      });
    }

    // In-progress session
    const assignedQueue = Array.isArray(participant.assigned_queue)
      ? participant.assigned_queue
      : [];
    const sanitizedTrials = sanitizeTrials(assignedQueue);

    let nextTrialIndex = null;
    if (answeredCount < 34) {
      nextTrialIndex = answeredCount + 1;
    }

    return jsonOk({
      participant_uuid: participant.participant_uuid,
      status: participant.status,
      form_id: participant.form_id,
      block_order: participant.block_order,
      demographics_completed: demographicsCompleted,
      demographics,
      answered_count: answeredCount,
      next_trial_index: nextTrialIndex,
      trials: sanitizedTrials,
      completion: null,
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
