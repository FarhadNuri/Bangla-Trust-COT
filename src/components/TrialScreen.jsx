// Core trial evaluation screen presenting stimulus and three verification probes
"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, Bot } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import ProgressHeader from "@/components/trial/ProgressHeader";
import CotSteps from "@/components/trial/CotSteps";
import TrustScale from "@/components/trial/TrustScale";
import McqOptions from "@/components/trial/McqOptions";
import FlawProbe from "@/components/trial/FlawProbe";

export default function TrialScreen({
  trial,
  totalTrials = 34,
  onSubmit,
  isSubmitting,
  errorMessage,
}) {
  // Trial form state: all fields start as null to force active participant engagement
  const [trustScore, setTrustScore] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [spottedFlaw, setSpottedFlaw] = useState(null);
  const [flawCategory, setFlawCategory] = useState(null);
  const [flawNote, setFlawNote] = useState("");

  // TIMER DESIGN:
  // Mutable useRef initialized with performance.now() measures response duration accurately
  // without triggering re-renders or resetting upon state updates.
  const startTimeRef = useRef(typeof window !== "undefined" ? performance.now() : 0);

  // Scroll to top automatically when a new trial mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  // SUBMIT VALIDATION:
  // All three probes must be answered; if spottedFlaw is true, category is required.
  const canSubmit =
    trustScore !== null &&
    selectedAnswer !== null &&
    spottedFlaw !== null &&
    (spottedFlaw === false || flawCategory !== null) &&
    !isSubmitting;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    const responseTimeMs = Math.round(performance.now() - startTimeRef.current);

    onSubmit({
      trust_score: trustScore,
      user_selected_answer: selectedAnswer,
      spotted_flaw: spottedFlaw,
      flaw_category: spottedFlaw ? flawCategory : null,
      flaw_note: spottedFlaw && flawNote.trim().length > 0 ? flawNote.trim() : null,
      response_time_ms: responseTimeMs,
    });
  }

  const isBangla = trial.language === "Bangla";

  return (
    <div className="w-full">
      {/* Sticky Progress Header */}
      <ProgressHeader
        trialIndex={trial.trial_index}
        total={totalTrials}
        blockNumber={trial.block_number}
      />

      {/* Responsive two-column layout: Left Stimulus, Right Verification */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Left Card: AI Stimulus */}
        <Card className="space-y-5 p-5 sm:p-6 lg:sticky lg:top-20">
          {/* Language Pill (color based on language only) */}
          <div className="flex items-center justify-between">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isBangla
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-sky-50 text-sky-700"
              }`}
            >
              {trial.language} Riddle
            </span>
          </div>

          {/* Riddle Box */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5 block">
              Riddle
            </span>
            <div className="rounded-xl bg-slate-50 p-4 sm:p-5 text-xl font-medium text-slate-900 border border-slate-200/60">
              <p
                lang={isBangla ? "bn" : "en"}
                className={
                  isBangla
                    ? "font-bangla leading-10"
                    : "leading-9"
                }
              >
                {trial.riddle_text}
              </p>
            </div>
          </div>

          {/* AI's Step-by-Step Reasoning */}
          <CotSteps cotText={trial.cot_text} language={trial.language} />

          {/* Final Answer Callout */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3.5 sm:p-4 text-indigo-900 flex items-start gap-3">
            <Bot className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700 block mb-0.5">
                AI&apos;s Final Answer
              </span>
              <span
                lang={isBangla ? "bn" : "en"}
                className={`text-lg font-bold text-slate-900 ${
                  isBangla ? "font-bangla" : ""
                }`}
              >
                {trial.ai_predicted_answer}
              </span>
            </div>
          </div>
        </Card>

        {/* Right Card: Verification Probes */}
        <Card className="space-y-6 p-5 sm:p-6">
          {/* Probe 1: Attitudinal Trust Scale */}
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-2.5">
              <span className="text-indigo-600 mr-2 font-bold">1.</span>
              How much do you trust the AI&apos;s step-by-step explanation?{" "}
              <span className="text-red-500">*</span>
            </h3>
            <TrustScale value={trustScore} onChange={setTrustScore} />
          </div>

          {/* Probe 2: Behavioral MCQ Selection */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2.5">
              <span className="text-indigo-600 mr-2 font-bold">2.</span>
              Based on the riddle and the AI&apos;s reasoning, what do you believe is the correct answer?{" "}
              <span className="text-red-500">*</span>
            </h3>
            <McqOptions
              options={trial.mcq_options}
              value={selectedAnswer}
              onChange={setSelectedAnswer}
              language={trial.language}
            />
          </div>

          {/* Probe 3: Flaw Detection Toggle & Probe */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2.5">
              <span className="text-indigo-600 mr-2 font-bold">3.</span>
              Did you notice any logical error or flaw in the AI&apos;s reasoning?{" "}
              <span className="text-red-500">*</span>
            </h3>
            <FlawProbe
              spottedFlaw={spottedFlaw}
              onSpottedFlawChange={setSpottedFlaw}
              flawCategory={flawCategory}
              onFlawCategoryChange={setFlawCategory}
              flawNote={flawNote}
              onFlawNoteChange={setFlawNote}
            />
          </div>

          {/* Submit Action Area */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            {errorMessage && (
              <Alert variant="error" className="mb-2">
                {errorMessage}
              </Alert>
            )}

            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!canSubmit}
              isLoading={isSubmitting}
              className="w-full py-3.5 text-base font-semibold"
            >
              <span>Submit &amp; Next</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>

            {!canSubmit && !isSubmitting && (
              <p className="text-sm text-slate-500 text-center">
                Please answer all three questions to continue.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
