"use client";

import PrimaryButton from "@/components/common/PrimaryButton";
import type { PlasticEntry } from "@/types/audit";

type SubmittedStepProps = {
  entries: PlasticEntry[];
  householdName: string;
  onStartNew: () => void;
};

export default function SubmittedStep({
  entries,
  householdName,
  onStartNew,
}: SubmittedStepProps) {
  const totalItems = entries.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <div className="max-w-xl mx-auto w-full text-center">
      <div className="text-6xl">🎉</div>
      <h1 className="text-3xl font-bold text-gray-800 mt-6">
        Thanks, {householdName || "friend"}!
      </h1>
      <p className="text-gray-600 mt-3">
        Your audit of <span className="font-bold text-gray-800">{totalItems}</span>{" "}
        {totalItems === 1 ? "item" : "items"} has been recorded and added to the
        nationwide dataset.
      </p>

      <div className="rounded-2xl bg-green-50 p-6 mt-8 text-sm text-gray-600 text-left">
        This audit was saved locally in your browser for this preview build.
        Once accounts and the backend are wired up (Module 2), this same
        submit action will send your entries to the FastAPI backend. Any
        items logged as &quot;Pending Review&quot; will show up in a
        researcher&apos;s Photo Review queue (Module 6) until someone
        assigns the real plastic type.
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <PrimaryButton href="/" variant="outline" size="lg">
          Back to Home
        </PrimaryButton>
        <PrimaryButton onClick={onStartNew} size="lg">
          Start a New Audit
        </PrimaryButton>
      </div>
    </div>
  );
}
