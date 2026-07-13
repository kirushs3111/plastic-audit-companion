"use client";

import PrimaryButton from "@/components/common/PrimaryButton";
import RecyclingBadge from "@/components/common/RecyclingBadge";
import { ITEM_CATEGORIES } from "@/data/plasticItems";
import { PLASTIC_TYPES } from "@/data/plasticTypes";
import { ROOMS } from "@/data/rooms";
import type { PlasticEntry, RoomId } from "@/types/audit";

type SummaryStepProps = {
  entries: PlasticEntry[];
  householdName: string;
  isSubmitting: boolean;
  onBack: () => void;
  onAddMore: () => void;
  onDeleteEntry: (id: string) => void;
  onSubmit: () => void;
};

export default function SummaryStep({
  entries,
  householdName,
  isSubmitting,
  onBack,
  onAddMore,
  onDeleteEntry,
  onSubmit,
}: SummaryStepProps) {
  const totalItems = entries.reduce((sum, e) => sum + e.quantity, 0);
  const pendingCount = entries.filter((e) => e.needsReview).reduce((sum, e) => sum + e.quantity, 0);
  const roomsUsed = Array.from(new Set(entries.map((e) => e.room))) as RoomId[];

  return (
    <div className="max-w-3xl mx-auto w-full">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-green-700 transition mb-6"
      >
        ← Back
      </button>

      <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">
        {householdName || "Your household"}
      </p>
      <h1 className="text-3xl font-bold text-gray-800">Audit Summary</h1>
      <p className="text-gray-600 mt-3">
        <span className="font-bold text-gray-800">{totalItems}</span> items across{" "}
        <span className="font-bold text-gray-800">{roomsUsed.length}</span>{" "}
        {roomsUsed.length === 1 ? "room" : "rooms"}.
        {pendingCount > 0 && (
          <>
            {" "}
            <span className="font-bold text-amber-600">{pendingCount}</span> awaiting review.
          </>
        )}
      </p>

      {entries.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-500">
          Nothing logged yet. Go back and add your first item.
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {roomsUsed.map((roomId) => {
            const room = ROOMS.find((r) => r.id === roomId);
            const roomEntries = entries.filter((e) => e.room === roomId);
            return (
              <div key={roomId}>
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-xl">{room?.emoji}</span> {room?.label}
                </h2>
                <div className="mt-3 space-y-2">
                  {roomEntries.map((entry) => {
                    const type = entry.plasticCode
                      ? PLASTIC_TYPES.find((t) => t.code === entry.plasticCode)
                      : null;
                    const itemLabel =
                      ITEM_CATEGORIES.find((i) => i.id === entry.item)?.label ?? entry.item;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 shadow-sm px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          {type ? (
                            <RecyclingBadge
                              number={type.code}
                              colorClass={type.colorClass}
                              size="sm"
                            />
                          ) : (
                            <span className="text-2xl">🔍</span>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">
                              {itemLabel}{" "}
                              {type ? (
                                <span className={`font-semibold ${type.colorClass}`}>
                                  ({type.abbreviation})
                                </span>
                              ) : (
                                <span className="font-semibold text-amber-600">
                                  (Pending Review)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-800">×{entry.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(entry.id)}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mt-10">
        <PrimaryButton variant="outline" size="lg" className="flex-1" onClick={onAddMore}>
          Add More Items
        </PrimaryButton>
        <PrimaryButton
          size="lg"
          className="flex-1"
          onClick={onSubmit}
          disabled={entries.length === 0 || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Audit"}
        </PrimaryButton>
      </div>
    </div>
  );
}
