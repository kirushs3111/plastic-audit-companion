"use client";

import PrimaryButton from "@/components/common/PrimaryButton";
import StepShell from "@/components/audit/StepShell";
import { ROOMS } from "@/data/rooms";
import type { RoomId } from "@/types/audit";

type RoomSelectStepProps = {
  entryCount: number;
  onSelect: (room: RoomId) => void;
  onViewSummary: () => void;
};

export default function RoomSelectStep({
  entryCount,
  onSelect,
  onViewSummary,
}: RoomSelectStepProps) {
  return (
    <StepShell
      eyebrow="Step 2"
      title="Which room are you in?"
      description="Pick a room to start counting the plastic items there."
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ROOMS.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelect(room.id)}
            className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition p-6 flex flex-col items-center gap-2 bg-white"
          >
            <span className="text-4xl">{room.emoji}</span>
            <span className="font-semibold text-gray-800">{room.label}</span>
          </button>
        ))}
      </div>

      {entryCount > 0 && (
        <div className="mt-10 rounded-2xl bg-green-50 p-5 flex items-center justify-between">
          <p className="text-gray-700">
            <span className="font-bold text-green-700">{entryCount}</span>{" "}
            {entryCount === 1 ? "item" : "items"} logged so far.
          </p>
          <PrimaryButton variant="outline" onClick={onViewSummary}>
            View Summary
          </PrimaryButton>
        </div>
      )}
    </StepShell>
  );
}
