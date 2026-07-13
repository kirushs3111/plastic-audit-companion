"use client";

import { useState } from "react";
import PrimaryButton from "@/components/common/PrimaryButton";
import RecyclingBadge from "@/components/common/RecyclingBadge";
import StepShell from "@/components/audit/StepShell";
import { ITEM_CATEGORIES } from "@/data/plasticItems";
import { PLASTIC_TYPES } from "@/data/plasticTypes";
import type { ItemCategoryId } from "@/types/audit";
import type { PlasticCode } from "@/types/plastic";

type QuantityStepProps = {
  item: ItemCategoryId;
  code: PlasticCode | null;
  isSaving: boolean;
  onBack: () => void;
  onSave: (quantity: number) => void;
};

export default function QuantityStep({ item, code, isSaving, onBack, onSave }: QuantityStepProps) {
  const [quantity, setQuantity] = useState(1);
  const itemLabel = ITEM_CATEGORIES.find((i) => i.id === item)?.label ?? item;
  const type = code ? PLASTIC_TYPES.find((t) => t.code === code) : null;

  return (
    <StepShell
      eyebrow="Last step"
      title={`How many ${itemLabel.toLowerCase()}s like this?`}
      description={
        type
          ? `Counting every ${type.abbreviation} ${itemLabel.toLowerCase()} you can see in this room.`
          : `Counting every unidentified ${itemLabel.toLowerCase()} matching these photos.`
      }
      onBack={onBack}
    >
      {type ? (
        <div className={`rounded-2xl ${type.bgClass} p-6 flex items-center gap-4`}>
          <RecyclingBadge number={type.code} colorClass={type.colorClass} />
          <div>
            <p className={`font-bold ${type.colorClass}`}>{type.abbreviation}</p>
            <p className="text-sm text-gray-600">{itemLabel}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-amber-50 p-6 flex items-center gap-4">
          <span className="text-3xl">🔍</span>
          <div>
            <p className="font-bold text-amber-700">Pending Review</p>
            <p className="text-sm text-gray-600">{itemLabel} - type to be identified</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-8 mt-10">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="w-14 h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold text-gray-700 transition"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="text-5xl font-extrabold text-gray-800 w-20 text-center">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(99, q + 1))}
          className="w-14 h-14 rounded-2xl bg-green-100 hover:bg-green-200 text-2xl font-bold text-green-700 transition"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <div className="mt-10">
        <PrimaryButton
          onClick={() => onSave(quantity)}
          size="lg"
          className="w-full"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save & Add Another Item"}
        </PrimaryButton>
      </div>
    </StepShell>
  );
}
