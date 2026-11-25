// Binary flaw detection toggle with conditional category selection and note input
"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { FLAW_CATEGORIES, MAX_FLAW_NOTE_LENGTH } from "@/lib/constants";

export default function FlawProbe({
  spottedFlaw,
  onSpottedFlawChange,
  flawCategory,
  onFlawCategoryChange,
  flawNote,
  onFlawNoteChange,
}) {
  return (
    <div className="space-y-4">
      {/* Primary Toggle Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            onSpottedFlawChange(false);
            onFlawCategoryChange(null);
            onFlawNoteChange("");
          }}
          className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer min-h-[48px] ${
            spottedFlaw === false
              ? "border-2 border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold shadow-2xs"
              : "border-slate-300 bg-white text-slate-700 font-medium hover:border-indigo-400 hover:bg-slate-50"
          }`}
        >
          <CheckCircle2
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              spottedFlaw === false ? "text-indigo-600" : "text-slate-400"
            }`}
          />
          <span className="text-sm sm:text-base leading-snug">
            No, the reasoning is logically sound
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSpottedFlawChange(true)}
          className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer min-h-[48px] ${
            spottedFlaw === true
              ? "border-2 border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold shadow-2xs"
              : "border-slate-300 bg-white text-slate-700 font-medium hover:border-indigo-400 hover:bg-slate-50"
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              spottedFlaw === true ? "text-amber-600" : "text-slate-400"
            }`}
          />
          <span className="text-sm sm:text-base leading-snug">
            Yes, I noticed a flaw in the reasoning
          </span>
        </button>
      </div>

      {/* Conditional Sub-questions when spottedFlaw is true */}
      {spottedFlaw === true && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-amber-950 mb-2">
              What type of flaw did you notice? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {FLAW_CATEGORIES.map((cat) => {
                const isSelected = flawCategory === cat.value;
                const catId = `flaw-cat-${cat.value}`;

                return (
                  <label
                    key={cat.value}
                    htmlFor={catId}
                    className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer text-sm transition-all focus-within:ring-2 focus-within:ring-amber-300 ${
                      isSelected
                        ? "border-2 border-amber-600 bg-white text-amber-950 font-semibold shadow-2xs"
                        : "border-amber-200/80 bg-white/70 text-slate-700 hover:bg-white font-medium"
                    }`}
                  >
                    <input
                      id={catId}
                      type="radio"
                      name="flaw_category"
                      value={cat.value}
                      checked={isSelected}
                      onChange={() => onFlawCategoryChange(cat.value)}
                      className="sr-only"
                    />
                    <div
                      className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? "border-amber-600 bg-amber-600" : "border-slate-300 bg-white"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <span>{cat.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="flaw-note-input"
              className="block text-xs font-semibold uppercase tracking-wide text-amber-950 mb-1"
            >
              Optional explanation (what seemed wrong?)
            </label>
            <input
              id="flaw-note-input"
              type="text"
              maxLength={MAX_FLAW_NOTE_LENGTH}
              value={flawNote}
              onChange={(e) => onFlawNoteChange(e.target.value)}
              placeholder="e.g., Step 2 claimed a property that contradicts the first clue"
              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 text-slate-900"
            />
            <span className="text-[11px] text-amber-800 mt-1 text-right block">
              {flawNote.length} / {MAX_FLAW_NOTE_LENGTH}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
