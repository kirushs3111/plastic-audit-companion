"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Do I need to know the plastic types before I start?",
    answer:
      "No. If you don't recognize a plastic, photograph it during the audit instead of guessing. A reviewer identifies it afterward and the entry updates automatically.",
  },
  {
    question: "Who identifies plastics I don't recognize?",
    answer:
      "A human reviewer, not an algorithm. Clear front, back and base photos - where the recycling number usually sits - make that review faster and more accurate.",
  },
  {
    question: "Is my household data private?",
    answer:
      "Your audit is tied to your household, not your identity. Aggregated, de-identified data is what feeds the nationwide dataset and research reports.",
  },
  {
    question: "Can I stop halfway through an audit?",
    answer:
      "Yes. Every audit session is saved as you go, so you can close the tab mid-room and pick up exactly where you left off from your dashboard.",
  },
  {
    question: "Is Plastic Audit Companion free to use?",
    answer:
      "Yes, for households and schools. Guest mode requires no signup at all; creating an account just lets you track audits over time.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-800">
          Frequently Asked Questions
        </h2>

        <div className="mt-12 space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-semibold text-gray-800">
                    {item.question}
                  </span>
                  <span
                    className={`shrink-0 text-green-600 text-2xl leading-none transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <p className="px-6 pb-5 text-gray-600">{item.answer}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
