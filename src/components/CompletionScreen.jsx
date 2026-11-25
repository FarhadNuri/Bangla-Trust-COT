// Participant completion screen presenting verification code, research debrief, and performance summary
"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Check } from "lucide-react";
import Card from "@/components/ui/Card";

export default function CompletionScreen({ completion }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const completionCode = completion?.completion_code || "--------";
  const summary = completion?.summary;

  async function handleCopy() {
    setCopyError(false);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(completionCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopyError(true);
      }
    } catch {
      setCopyError(true);
    }
  }

  /*
    CRITICAL RESEARCH NOTE:
    We deliberately DO NOT display `completion.attention_checks_passed` on the client screen.
    Attention checks serve strictly as an internal data-quality validation metric for statistical
    filtering during analysis. Informing participants of attention-check pass/fail status would
    invite second-guessing, contestation, or gaming behavior across peer networks.
  */

  return (
    <Card className="max-w-xl mx-auto text-center space-y-6 w-full">
      {/* Success Icon */}
      <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      {/* Header & Debrief */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-2">
          Thank you for participating!
        </h1>
        <p className="text-sm text-slate-600 sm:text-base leading-relaxed max-w-lg mx-auto">
          In this study, some of the AI&apos;s step-by-step reasoning explanations were deliberately
          generated with subtle flaws. Our goal is to measure how human trust calibrates when
          presented with AI reasoning in low-resource and high-resource languages.
        </p>
      </div>

      {/* Completion Code Monospace Box */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block">
          Your completion code
        </span>
        <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-6 py-4 font-mono text-3xl font-bold tracking-widest text-indigo-700 select-all shadow-2xs">
          {completionCode}
        </div>
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="Copy verification code"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
        {copyError && (
          <p className="text-xs text-amber-600">
            Could not auto-copy. Please select and copy the code manually.
          </p>
        )}
      </div>

      {/* Results Summary */}
      {summary && (
        <div className="space-y-4 pt-2 text-left">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block text-center">
            Results Summary
          </span>

          {/* Two Stat Tiles Side-by-Side */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-3xl font-bold text-slate-900">
                {summary.user_correct_count} / {summary.scored_trials || 32}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-1">
                Your correct answers
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-3xl font-bold text-slate-900">
                {summary.ai_correct_count} / {summary.scored_trials || 32}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-1">
                AI correct answers
              </p>
            </div>
          </div>

          {/* Clean Language Breakdown Table */}
          {summary.by_language && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr>
                    <th className="py-2.5 px-4 text-left font-medium">Language</th>
                    <th className="py-2.5 px-4 text-center font-medium">You Correct</th>
                    <th className="py-2.5 px-4 text-center font-medium">AI Correct</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                  {summary.by_language.Bangla && (
                    <tr>
                      <td className="py-2.5 px-4 text-left font-medium">Bangla</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-slate-900">
                        {summary.by_language.Bangla.user_correct_count} /{" "}
                        {summary.by_language.Bangla.total}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-600">
                        {summary.by_language.Bangla.ai_correct_count} /{" "}
                        {summary.by_language.Bangla.total}
                      </td>
                    </tr>
                  )}
                  {summary.by_language.English && (
                    <tr>
                      <td className="py-2.5 px-4 text-left font-medium">English</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-slate-900">
                        {summary.by_language.English.user_correct_count} /{" "}
                        {summary.by_language.English.total}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-600">
                        {summary.by_language.English.ai_correct_count} /{" "}
                        {summary.by_language.English.total}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Muted Page Closure Notice */}
      <div className="pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400">
          You can close this page now.
        </p>
      </div>
    </Card>
  );
}
