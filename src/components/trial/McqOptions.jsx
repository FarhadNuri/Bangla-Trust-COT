// Four-option MCQ radio selection cards with accessible focus ring
"use client";

export default function McqOptions({ options, value, onChange, language }) {
  const isBangla = language === "Bangla";

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Multiple choice answer options">
      {options.map((option, index) => {
        const isSelected = value === option;
        const optionId = `mcq-option-${index}`;

        return (
          <label
            key={index}
            htmlFor={optionId}
            className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-indigo-300 ${
              isSelected
                ? "border-2 border-indigo-600 bg-indigo-50 shadow-2xs"
                : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50"
            }`}
          >
            <input
              id={optionId}
              type="radio"
              name="user_selected_answer"
              value={option}
              checked={isSelected}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {/* Custom radio indicator */}
            <div
              className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
              }`}
              aria-hidden="true"
            >
              {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
            <span
              lang={isBangla ? "bn" : "en"}
              className={`text-base ${
                isSelected ? "font-semibold text-indigo-950" : "font-medium text-slate-800"
              } ${isBangla ? "font-bangla leading-relaxed" : ""}`}
            >
              {option}
            </span>
          </label>
        );
      })}
    </div>
  );
}
