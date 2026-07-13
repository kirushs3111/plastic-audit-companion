"use client";

import PrimaryButton from "@/components/common/PrimaryButton";
import StepShell from "@/components/audit/StepShell";
import { ITEM_CATEGORIES } from "@/data/plasticItems";
import { ROOMS } from "@/data/rooms";
import type { ItemCategoryId, PlasticEntry, RoomId } from "@/types/audit";

type ItemSelectStepProps = {
  room: RoomId;
  entriesInRoom: PlasticEntry[];
  onSelect: (item: ItemCategoryId) => void;
  onChangeRoom: () => void;
  onViewSummary: () => void;
};

export default function ItemSelectStep({
  room,
  entriesInRoom,
  onSelect,
  onChangeRoom,
  onViewSummary,
}: ItemSelectStepProps) {
  const roomLabel = ROOMS.find((r) => r.id === room)?.label ?? room;
  const itemCount = entriesInRoom.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <StepShell
      eyebrow={`Room: ${roomLabel}`}
      title="What kind of item is it?"
      onBack={onChangeRoom}
    >
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
        {ITEM_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 transition p-5 flex flex-col items-center gap-2 bg-white"
          >
            <span className="text-3xl">{item.emoji}</span>
            <span className="text-sm font-semibold text-gray-800 text-center">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {entriesInRoom.length > 0 && (
        <div className="mt-10 rounded-2xl bg-blue-50 p-5 flex items-center justify-between">
          <p className="text-gray-700">
            <span className="font-bold text-blue-700">{itemCount}</span>{" "}
            {itemCount === 1 ? "item" : "items"} logged in {roomLabel} so far.
          </p>
          <PrimaryButton variant="outline" onClick={onViewSummary}>
            View Summary
          </PrimaryButton>
        </div>
      )}
    </StepShell>
  );
}
