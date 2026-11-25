export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { jsonError, handleUnexpectedError } from "@/lib/http";
import { checkAdminAuth } from "@/lib/adminAuth";
import { buildCsv } from "@/lib/csv";
import { getSlot } from "@/lib/routing";

export async function GET(request) {
  try {
    // 1. Strict authentication check
    if (!checkAdminAuth(request)) {
      return jsonError("UNAUTHORIZED", "Missing or invalid authorization credentials");
    }

    const { searchParams } = new URL(request.url);
    const completedOnly = searchParams.get("completed_only") === "true";
    const includeName = searchParams.get("include_name") === "true";

    // 2. Query participants with ordered trial responses
    const whereClause = completedOnly ? { status: "COMPLETED" } : {};

    const participants = await prisma.participant.findMany({
      where: whereClause,
      orderBy: { id: "asc" },
      include: {
        responses: {
          orderBy: { trial_index: "asc" },
        },
      },
    });

    // 3. Define the exact columns defined in docs/03_API_CONTRACT.md section 7
    const columns = [
      "participant_id",
      "participant_uuid",
      ...(includeName ? ["participant_name"] : []),
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

    // 4. Flatten participant-response pairs into CSV rows
    const rows = [];

    for (const p of participants) {
      const slot = getSlot(p.id);

      for (const r of p.responses) {
        const ai_correct = r.ai_predicted_answer === r.ground_truth_answer ? 1 : 0;
        const presented_options = JSON.stringify(r.presented_options);

        const row = {
          participant_id: p.id,
          participant_uuid: p.participant_uuid,
          ...(includeName ? { participant_name: p.participant_name } : {}),
          form_id: p.form_id,
          block_order: p.block_order,
          slot,
          age: p.age,
          gender: p.gender,
          native_language: p.native_language,
          english_proficiency: p.english_proficiency,
          education_medium: p.education_medium,
          ai_usage: p.ai_usage,
          status: p.status,
          attention_checks_passed: p.attention_checks_passed,
          started_at: p.started_at,
          completed_at: p.completed_at,
          trial_index: r.trial_index,
          block_number: r.block_number,
          is_attention_check: r.is_attention_check,
          item_id: r.item_id,
          condition: r.condition,
          language: r.language,
          fidelity: r.fidelity,
          ft_code: r.ft_code,
          ai_predicted_answer: r.ai_predicted_answer,
          ground_truth_answer: r.ground_truth_answer,
          ai_correct,
          presented_options,
          trust_score: r.trust_score,
          user_selected_answer: r.user_selected_answer,
          accepted_ai_answer: r.accepted_ai_answer,
          user_correct: r.user_correct,
          spotted_flaw: r.spotted_flaw,
          flaw_category: r.flaw_category,
          flaw_note: r.flaw_note,
          response_time_ms: r.response_time_ms,
          created_at: r.created_at,
        };

        rows.push(row);
      }
    }

    // 5. Build full CSV with UTF-8 BOM
    const csvContent = buildCsv(columns, rows);

    const today = new Date().toISOString().slice(0, 10);
    const filename = `banglatrust_export_${today}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
