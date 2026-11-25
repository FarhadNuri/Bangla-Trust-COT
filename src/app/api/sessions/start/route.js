export const runtime = "nodejs";

import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleUnexpectedError } from "@/lib/http";
import { getAssignment } from "@/lib/routing";
import { getFormItems, getAttentionChecks } from "@/lib/stimuli";
import { buildQueue } from "@/lib/buildQueue";
import { sanitizeTrials } from "@/lib/sanitize";

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError("VALIDATION_ERROR", "Invalid JSON in request body");
    }

    if (!body || body.consent !== true) {
      return jsonError(
        "VALIDATION_ERROR",
        "consent must be exactly true to begin the study",
        { field: "consent" }
      );
    }

    // Inside a database transaction, we create a temporary placeholder row to obtain
    // an autoincrement ID for deterministic counterbalancing (id - 1) % 8.
    // The placeholder row only lives inside this transaction; if queue building fails,
    // the transaction rolls back cleanly, leaving no half-built participant in the database.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create initial participant row to get auto-increment id
      const created = await tx.participant.create({
        data: {
          form_id: "Form_A",
          block_order: "BN_FIRST",
          assigned_queue: [],
          consent_at: new Date(),
        },
      });

      // 2. Deterministically determine slot, form, and block order from the participant id
      const { form_id, block_order } = getAssignment(created.id);

      // 3. Load stimuli and construct the counterbalanced 34-trial queue
      const formItems = getFormItems(form_id);
      const attentionChecks = getAttentionChecks();
      const queue = buildQueue(formItems, block_order, attentionChecks);

      // 4. Update the participant with the finalized queue and cell assignments
      const updated = await tx.participant.update({
        where: { id: created.id },
        data: {
          form_id,
          block_order,
          assigned_queue: queue,
        },
      });

      return { participant: updated, queue };
    });

    const sanitizedTrials = sanitizeTrials(result.queue);

    return jsonOk(
      {
        participant_uuid: result.participant.participant_uuid,
        form_id: result.participant.form_id,
        block_order: result.participant.block_order,
        trials: sanitizedTrials,
      },
      201
    );
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
