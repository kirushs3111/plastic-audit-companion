"use client";

import { useState } from "react";
import type { LearnQuizQuestion } from "@/data/learnContent";

export default function PlasticQuiz({ quiz }: { quiz: LearnQuizQuestion }) {
  const [selected, setSelected] = useState<number | null>(null);

  const isCorrect = selected !== null && selected === quiz.correctIndex;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
        Quick Quiz
      </p>
      <p className="font-semibold text-gray-800">{quiz.question}</p>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {quiz.options.map((option, index) => {
          const isSelected = selected === index;
          const isRight = index === quiz.correctIndex;
          const showResult = selected !== null;

          let classes = "border-gray-200 hover:border-blue-400 text-gray-700";
          if (showResult && isRight) {
            classes = "border-green-500 bg-green-50 text-green-700";
          } else if (showResult && isSelected && !isRight) {
            classes = "border-red-400 bg-red-50 text-red-600";
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(index)}
              disabled={selected !== null}
              className={`text-left px-4 py-3 rounded-xl border-2 font-medium transition ${classes}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p
          className={`mt-4 text-sm font-medium ${isCorrect ? "text-green-600" : "text-gray-600"}`}
        >
          {isCorrect
            ? "Correct! 🎉"
            : `Not quite - the answer is "${quiz.options[quiz.correctIndex]}".`}
        </p>
      )}
    </div>
  );
}
