// Sticky progress bar tracking trial index and section number
"use client";

export default function ProgressHeader({ trialIndex, total, blockNumber }) {
  const percentage = Math.min(100, Math.max(0, Math.round((trialIndex / total) * 100)));

  return (
    <header className="sticky top-0 z-10 -mx-4 bg-slate-50/90 px-4 py-3 backdrop-blur mb-6 border-b border-slate-200/60 sm:rounded-b-xl">
      <div className="flex items-center justify-between text-sm font-semibold mb-2">
        <span className="text-slate-800">
          Question {trialIndex} of {total}
        </span>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          Section {blockNumber}/2
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all duration-300 motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </header>
  );
}
