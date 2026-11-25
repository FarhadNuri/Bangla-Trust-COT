// Participant demographics questionnaire collecting normalization covariates before study trials
"use client";

import { useState } from "react";
import {
  GENDERS,
  NATIVE_LANGUAGES,
  AI_USAGE_OPTIONS,
} from "@/lib/constants";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Field from "@/components/ui/Field";

export default function DemographicsScreen({ onSubmit, isSaving, errorMessage }) {
  const [formData, setFormData] = useState({
    participant_name: "",
    age: "",
    gender: "",
    native_language: "",
    english_proficiency: 0,
    ai_usage: "",
  });

  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Validate form matching server requirements
  const errors = {};
  if (hasSubmitted) {
    const ageNum = Number(formData.age);
    if (!formData.age || !Number.isInteger(ageNum) || ageNum < 18 || ageNum > 99) {
      errors.age = "Please enter an integer age between 18 and 99.";
    }
    if (!formData.gender) {
      errors.gender = "Please select your gender.";
    }
    if (!formData.native_language) {
      errors.native_language = "Please select your native language.";
    }
    if (!formData.english_proficiency || formData.english_proficiency < 1 || formData.english_proficiency > 7) {
      errors.english_proficiency = "Please select your English proficiency (1–7).";
    }
    if (!formData.ai_usage) {
      errors.ai_usage = "Please select your AI usage frequency.";
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setHasSubmitted(true);

    const ageNum = Number(formData.age);
    if (
      !formData.age ||
      !Number.isInteger(ageNum) ||
      ageNum < 18 ||
      ageNum > 99 ||
      !formData.gender ||
      !formData.native_language ||
      !formData.english_proficiency ||
      !formData.ai_usage
    ) {
      return;
    }

    onSubmit({
      participant_name: formData.participant_name.trim() || null,
      age: ageNum,
      gender: formData.gender,
      native_language: formData.native_language,
      english_proficiency: Number(formData.english_proficiency),
      education_medium: null,
      ai_usage: formData.ai_usage,
    });
  }

  return (
    <Card className="max-w-2xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl leading-tight">
          Participant Background
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
          Please answer these background questions. This information is confidential and used for
          statistical normalization in our thesis analysis.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="error">
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name / Initials (Optional) */}
        <Field
          label="Name or Initials (Optional)"
          htmlFor="input-name"
          hint="You may leave this blank for complete anonymity."
        >
          <input
            id="input-name"
            type="text"
            maxLength={100}
            value={formData.participant_name}
            onChange={(e) =>
              setFormData({ ...formData, participant_name: e.target.value })
            }
            placeholder="e.g., F. Ahmed"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </Field>

        {/* Age (Required) */}
        <Field
          label="Age"
          htmlFor="input-age"
          required
          error={errors.age}
        >
          <input
            id="input-age"
            type="number"
            min={18}
            max={99}
            value={formData.age}
            onChange={(e) =>
              setFormData({ ...formData, age: e.target.value })
            }
            placeholder="18 – 99"
            className="w-full sm:w-48 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </Field>

        {/* Gender (Required) */}
        <Field
          label="Gender"
          required
          error={errors.gender}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {GENDERS.map((g) => {
              const isSelected = formData.gender === g;
              return (
                <button
                  type="button"
                  key={g}
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-lg border text-sm text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? "border-2 border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold shadow-2xs"
                      : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div
                    className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span>{g}</span>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Native Language (Required) */}
        <Field
          label="Native Language"
          required
          error={errors.native_language}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {NATIVE_LANGUAGES.map((lang) => {
              const isSelected = formData.native_language === lang;
              return (
                <button
                  type="button"
                  key={lang}
                  onClick={() => setFormData({ ...formData, native_language: lang })}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-lg border text-sm text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? "border-2 border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold shadow-2xs"
                      : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div
                    className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span>{lang}</span>
                </button>
              );
            })}
          </div>
        </Field>

        {/* English Proficiency (Required) */}
        <Field
          label="Self-Rated English Proficiency (1 = Beginner, 7 = Bilingual / Native)"
          required
          error={errors.english_proficiency}
        >
          <div className="space-y-1.5">
            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isSelected = formData.english_proficiency === num;
                return (
                  <button
                    type="button"
                    key={num}
                    onClick={() =>
                      setFormData({ ...formData, english_proficiency: num })
                    }
                    className={`min-h-[44px] flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
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
            <div className="flex flex-wrap justify-between text-xs text-slate-500 px-0.5 font-medium gap-1">
              <span>1 = Beginner</span>
              <span className="text-center">4 = Competent</span>
              <span className="text-right">7 = Bilingual / Native</span>
            </div>
          </div>
        </Field>

        {/* AI Usage Frequency (Required) */}
        <Field
          label="How frequently do you use AI reasoning tools (e.g., ChatGPT, Claude, Gemini)?"
          required
          error={errors.ai_usage}
        >
          <div className="space-y-2">
            {AI_USAGE_OPTIONS.map((opt) => {
              const isSelected = formData.ai_usage === opt;
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setFormData({ ...formData, ai_usage: opt })}
                  className={`min-h-[44px] w-full px-3.5 py-2.5 rounded-lg border text-sm text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? "border-2 border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold shadow-2xs"
                      : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div
                    className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Continue Button */}
        <div className="pt-4 border-t border-slate-200">
          <Button
            type="submit"
            isLoading={isSaving}
            className="w-full"
          >
            Continue to Study
          </Button>
        </div>
      </form>
    </Card>
  );
}
