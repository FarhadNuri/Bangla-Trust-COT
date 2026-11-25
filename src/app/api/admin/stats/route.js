export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleUnexpectedError } from "@/lib/http";
import { checkAdminAuth } from "@/lib/adminAuth";
import {
  buildCellCounts,
  buildAttentionCounts,
  averageCompletionSeconds,
  findSpeeders,
} from "@/lib/stats";
import { SPEEDER_THRESHOLD_MS } from "@/lib/constants";

export async function GET(request) {
  try {
    // 1. Strict timing-safe Bearer authentication check (never log secret)
    if (!checkAdminAuth(request)) {
      return jsonError("UNAUTHORIZED", "Missing or invalid authorization credentials");
    }

    // 2. Query participants selecting only fields needed for statistics
    const participants = await prisma.participant.findMany({
      select: {
        id: true,
        participant_uuid: true,
        status: true,
        attention_checks_passed: true,
        started_at: true,
        completed_at: true,
      },
    });

    // 3. Query responses for speeder detection (strictly response times and attention flag)
    const responses = await prisma.trialResponse.findMany({
      select: {
        participant_uuid: true,
        response_time_ms: true,
        is_attention_check: true,
      },
    });

    // 4. Compute metrics using pure stats module
    const inProgressCount = participants.filter((p) => p.status === "IN_PROGRESS").length;
    const completedCount = participants.filter((p) => p.status === "COMPLETED").length;

    const totals = {
      participants: participants.length,
      in_progress: inProgressCount,
      completed: completedCount,
    };

    const cells = buildCellCounts(participants);
    const attention = buildAttentionCounts(participants);
    const avg_completion_seconds = averageCompletionSeconds(participants);
    const speeders = findSpeeders(participants, responses, SPEEDER_THRESHOLD_MS);

    return jsonOk({
      totals,
      cells,
      attention,
      avg_completion_seconds,
      speeders,
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
