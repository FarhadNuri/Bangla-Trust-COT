// Chain-of-thought steps display with numbered badges and inline bold parsing
"use client";

import React from "react";

/**
 * Parses inline markdown bold syntax `**bold**` into React <strong> elements
 * without ever using dangerouslySetInnerHTML.
 * Unmatched asterisks or plain text are safely rendered as text strings.
 *
 * @param {string} text
 * @returns {Array<React.ReactNode>}
 */
export function renderInlineBold(text) {
  if (typeof text !== "string") return text;

  // Split on **...** capturing the bold text
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {boldText}
        </strong>
      );
    }
    return part;
  });
}

export default function CotSteps({ cotText, language }) {
  if (!cotText || typeof cotText !== "string") {
    return null;
  }

  const isBangla = language === "Bangla";

  // Split steps on newline and drop empty lines
  const steps = cotText
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block">
        AI&apos;s step-by-step reasoning
      </span>
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            lang={isBangla ? "bn" : "en"}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
          >
            <div
              className={`text-base leading-8 text-slate-800 ${
                isBangla ? "font-bangla leading-9" : ""
              }`}
            >
              {renderInlineBold(step)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
