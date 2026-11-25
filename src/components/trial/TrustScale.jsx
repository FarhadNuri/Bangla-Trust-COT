// 7-point Likert trust scale with tap-friendly targets and anchor labels
"use client";

export default function TrustScale({ value, onChange }) {
  const options = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="w-full">
      <div
        role="radiogroup"
        aria-label="Attitudinal trust rating from 1 to 7"
        className="grid grid-cols-7 gap-2"
      >
        {options.map((num) => {
          const isSelected = value === num;
          return (
            <button
              type="button"
              key={num}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Trust rating ${num} of 7`}
              onClick={() => onChange(num)}
              className={`min-h-[48px] flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                isSelected
                  ? "border-2 border-indigo-600 bg-indigo-600 text-white font-bold ring-2 ring-indigo-200 shadow-xs"
                  : "border border-slate-300 bg-white text-slate-700 font-semibold hover:border-indigo-400 hover:bg-indigo-50"
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-between text-xs text-slate-500 mt-2 px-0.5 font-medium gap-1">
        <span>1 = Do not trust at all</span>
        <span className="text-center">4 = Neutral</span>
        <span className="text-right">7 = Completely trust</span>
      </div>
    </div>
  );
}
