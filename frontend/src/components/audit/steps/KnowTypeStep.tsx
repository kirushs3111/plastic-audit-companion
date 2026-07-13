"use client";

import PrimaryButton from "@/components/common/PrimaryButton";
import StepShell from "@/components/audit/StepShell";
import { ITEM_CATEGORIES } from "@/data/plasticItems";
import type { ItemCategoryId } from "@/types/audit";

type KnowTypeStepProps = {
  item: ItemCategoryId;
  onBack: () => void;
  onYes: () => void;
  onNo: () => void;
};

export default function KnowTypeStep({ item, onBack, onYes, onNo }: KnowTypeStepProps) {
  const itemLabel = ITEM_CATEGORIES.find((i) => i.id === item)?.label ?? item;

  return (
    <StepShell
      eyebrow={itemLabel}
      title="Do you know the plastic type?"
      description="Check the bottom of the item for a small triangle with a number 1-7 - that's the fastest way to know for sure."
      onBack={onBack}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <PrimaryButton onClick={onYes} size="lg" className="flex-1">
          Yes, I know it
        </PrimaryButton>
        <PrimaryButton onClick={onNo} variant="secondary" size="lg" className="flex-1">
          No, I&apos;ll photograph it
        </PrimaryButton>
      </div>
    </StepShell>
  );
}
