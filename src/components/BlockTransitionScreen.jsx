// Block transition screen introducing section language and trial count
"use client";

import { Languages, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function BlockTransitionScreen({
  blockNumber,
  language,
  trialCount = 17,
  onBegin,
}) {
  const isBangla = language === "Bangla";

  return (
    <Card className="text-center max-w-xl mx-auto w-full">
      {/* Icon Circle */}
      <div className="h-14 w-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
        <Languages className="w-7 h-7" />
      </div>

      {/* Small Label */}
      <span className="block text-sm font-semibold uppercase tracking-wider text-indigo-600 mb-2">
        Part {blockNumber} of 2
      </span>

      {/* Heading */}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-4">
        {language} Riddles — {trialCount} Questions
      </h1>

      {/* Reminder Paragraph */}
      <div className="max-w-md mx-auto text-sm text-slate-600 sm:text-base mb-6 leading-relaxed">
        {isBangla ? (
          <p lang="bn" className="font-bangla leading-relaxed text-slate-700">
            পরবর্তী {trialCount}টি প্রশ্ন <strong>বাংলা ধাঁধা</strong> নিয়ে গঠিত। প্রতিটি প্রশ্নের
            ধাপভিত্তিক যুক্তি (reasoning steps) মনোযোগ দিয়ে পড়ুন এবং যাচাই করুন যুক্তিগুলো সঠিক কি না।
          </p>
        ) : (
          <p lang="en" className="leading-relaxed text-slate-700">
            The next {trialCount} riddles are in <strong>English</strong>. Remember to carefully evaluate
            each step of the AI&apos;s reasoning, not just its final conclusion.
          </p>
        )}
      </div>

      {/* Two-dot Section Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8" aria-label={`Section ${blockNumber} of 2`}>
        <div
          className={`h-2 rounded-full transition-all ${
            blockNumber === 1 ? "w-8 bg-indigo-600" : "w-2 bg-slate-300"
          }`}
          title="Section 1"
        />
        <div
          className={`h-2 rounded-full transition-all ${
            blockNumber === 2 ? "w-8 bg-indigo-600" : "w-2 bg-slate-300"
          }`}
          title="Section 2"
        />
      </div>

      {/* Primary Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={onBegin}
          className="w-full sm:w-auto px-8"
        >
          <span>Begin Section</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
