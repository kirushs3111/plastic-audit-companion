"use client";

import { useState } from "react";
import RecyclingBadge from "@/components/common/RecyclingBadge";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import { ITEM_CATEGORIES } from "@/data/plasticItems";
import { PLASTIC_TYPES } from "@/data/plasticTypes";
import { ROOMS } from "@/data/rooms";
import type { ApiPlasticEntry } from "@/types/api";

type ReviewCardProps = {
  entry: ApiPlasticEntry;
  onAssign: (entryId: string, plasticCode: number) => Promise<void>;
};

export default function ReviewCard({ entry, onAssign }: ReviewCardProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedCode, setSelectedCode] = useState<number | null>(null);

  const room = ROOMS.find((r) => r.id === entry.room);
  const item = ITEM_CATEGORIES.find((i) => i.id === entry.item);

  async function handleAssign(code: number) {
    setSelectedCode(code);
    setIsAssigning(true);
    try {
      await onAssign(entry.id, code);
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-800">
          {room?.emoji} {room?.label} · {item?.emoji} {item?.label}
        </p>
        <span className="text-sm text-gray-400">×{entry.quantity}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {entry.photos.length === 0 && (
          <p className="text-sm text-gray-400 col-span-3">No photos attached.</p>
        )}
        {entry.photos.map((photo) => (
          <div key={photo.id}>
            <AuthenticatedImage
              path={photo.storage_url}
              alt={`${photo.slot} of item`}
              className="w-full h-28 object-cover rounded-xl"
            />
            <p className="text-xs text-gray-400 mt-1 text-center capitalize">{photo.slot}</p>
          </div>
        ))}
      </div>

      <p className="text-sm font-medium text-gray-600 mt-5 mb-2">Assign plastic type:</p>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {PLASTIC_TYPES.map((type) => (
          <button
            key={type.code}
            type="button"
            disabled={isAssigning}
            onClick={() => handleAssign(type.code)}
            className={`rounded-xl ${type.bgClass} p-2 flex flex-col items-center gap-1 disabled:opacity-50 hover:ring-2 hover:ring-offset-1 transition`}
          >
            <RecyclingBadge number={type.code} colorClass={type.colorClass} size="sm" />
            <span className={`text-xs font-bold ${type.colorClass}`}>{type.abbreviation}</span>
          </button>
        ))}
      </div>
      {isAssigning && (
        <p className="text-sm text-gray-400 mt-3">
          Assigning {PLASTIC_TYPES.find((t) => t.code === selectedCode)?.abbreviation}...
        </p>
      )}
    </div>
  );
}
