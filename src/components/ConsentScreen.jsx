// Study consent screen detailing academic research context, procedure rules, and participant agreement
"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function ConsentScreen({ onStart, isLoading, errorMessage }) {
  const [hasAgreed, setHasAgreed] = useState(false);

  return (
    <Card className="max-w-2xl mx-auto w-full space-y-6">
      {/* Header */}
      <div>
        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
          Research Study
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl leading-tight">
          Trust in AI Reasoning: Bangla &amp; English Riddles
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
          This academic study investigates how people evaluate step-by-step reasoning
          (Chain-of-Thought) produced by AI models when solving riddles in Bangla and English.
        </p>
      </div>

      {/* Protocol Summary Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 text-sm text-slate-700 space-y-2">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Study Overview: ~12–15 minutes (34 total questions)</span>
        </div>
        <p className="text-slate-600 text-xs sm:text-sm pl-6 leading-relaxed">
          You will complete two sections of 17 questions each. All responses are completely anonymous
          and used solely for undergraduate CS thesis research.
        </p>
      </div>

      {/* Rules and Instructions */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Important Rules
        </h2>
        <ul className="space-y-3 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold shrink-0 mt-0.5">
              1
            </span>
            <span className="leading-relaxed">
              <strong className="text-slate-900">Evaluate the reasoning steps carefully:</strong> Do not just look at the
              AI&apos;s final answer. An explanation may sound confident and authoritative, yet
              contain a subtle flaw, contradiction, or leap in logic.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold shrink-0 mt-0.5">
              2
            </span>
            <span className="leading-relaxed">
              <strong className="text-slate-900">No external aids:</strong> Please do NOT use Google, ChatGPT, dictionaries, or
              other tools. We want your natural intuition and judgment.
            </span>
          </li>
        </ul>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <Alert variant="error">
          {errorMessage}
        </Alert>
      )}

      {/* Consent Checkbox */}
      <div className="pt-4 border-t border-slate-200">
        <label className="flex items-start gap-3 cursor-pointer select-none min-h-[44px] p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            disabled={isLoading}
            className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-300 cursor-pointer"
          />
          <span className="text-sm font-medium text-slate-800 leading-snug">
            I am 18 years or older, fluent in Bangla, and voluntarily consent to participate in this
            study.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={onStart}
          disabled={!hasAgreed || isLoading}
          isLoading={isLoading}
          className="w-full"
        >
          Start Study
        </Button>
      </div>
    </Card>
  );
}
