"use client";

import RecyclingBadge from "@/components/common/RecyclingBadge";
import StepShell from "@/components/audit/StepShell";
import { PLASTIC_TYPES } from "@/data/plasticTypes";
import type { PlasticCode } from "@/types/plastic";

type KnownTypeStepProps = {
  onBack: () => void;
  onChoose: (code: PlasticCode) => void;
};

export default function KnownTypeStep({ onBack, onChoose }: KnownTypeStepProps) {
  return (
    <StepShell eyebrow="Known plastic" title="Which type is it?" onBack={onBack}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {PLASTIC_TYPES.map((type) => (
          <button
            key={type.code}
            type="button"
            onClick={() => onChoose(type.code)}
            className={`rounded-2xl ${type.bgClass} p-5 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition`}
          >
            <RecyclingBadge number={type.code} colorClass={type.colorClass} />
            <span className={`font-bold ${type.colorClass}`}>{type.abbreviation}</span>
          </button>
        ))}
      </div>
    </StepShell>
  );
}
