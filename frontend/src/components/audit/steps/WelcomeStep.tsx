"use client";

import PrimaryButton from "@/components/common/PrimaryButton";

type WelcomeStepProps = {
  onBegin: () => void;
};

export default function WelcomeStep({ onBegin }: WelcomeStepProps) {
  return (
    <div className="max-w-2xl mx-auto w-full text-center">
      <div className="text-6xl">🏠</div>
      <h1 className="text-4xl font-bold text-gray-800 mt-6">
        Let&apos;s count your household&apos;s plastic
      </h1>
      <p className="text-lg text-gray-600 mt-4">
        Walk room by room. For each plastic item you find, tell us the type
        if you know it, or photograph it and let a reviewer identify it
        for you. Takes about 15 minutes for an average home.
      </p>

      <div className="mt-10">
        <PrimaryButton onClick={onBegin} size="lg">
          Begin Audit
        </PrimaryButton>
      </div>
    </div>
  );
}
