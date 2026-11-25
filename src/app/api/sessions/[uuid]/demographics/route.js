export const runtime = "nodejs";

import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleUnexpectedError, isValidUuid } from "@/lib/http";
import { validateDemographics } from "@/lib/validation";

export async function PATCH(request, { params }) {
  try {
    const { uuid } = await params;

    if (!isValidUuid(uuid)) {
      return jsonError("VALIDATION_ERROR", "Invalid participant UUID format", {
        field: "uuid",
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError("VALIDATION_ERROR", "Invalid JSON in request body");
    }

    const validation = validateDemographics(body);
    if (!validation.ok) {
      return jsonError("VALIDATION_ERROR", validation.error.message, {
        field: validation.error.field,
      });
    }

    const participant = await prisma.participant.findUnique({
      where: { participant_uuid: uuid },
    });

    if (!participant) {
      return jsonError("NOT_FOUND", "Participant session not found");
    }

    // Gating rule 1: Completed sessions cannot be modified
    if (participant.status === "COMPLETED") {
      return jsonError(
        "SESSION_COMPLETED",
        "Cannot edit demographics for a completed session"
      );
    }

    // Gating rule 2 (Decision D6): Demographics are locked once trial responses begin
    const existingResponseCount = await prisma.trialResponse.count({
      where: { participant_uuid: uuid },
    });

    if (existingResponseCount > 0) {
      return jsonError(
        "DEMOGRAPHICS_LOCKED",
        "Demographics cannot be modified after trial responses have begun"
      );
    }

    await prisma.participant.update({
      where: { participant_uuid: uuid },
      data: {
        participant_name: validation.value.participant_name,
        age: validation.value.age,
        gender: validation.value.gender,
        native_language: validation.value.native_language,
        english_proficiency: validation.value.english_proficiency,
        education_medium: validation.value.education_medium,
        ai_usage: validation.value.ai_usage,
      },
    });

    return jsonOk({ saved: true, demographics_completed: true });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
