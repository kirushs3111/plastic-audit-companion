"use client";

import { useRef } from "react";
import PrimaryButton from "@/components/common/PrimaryButton";
import StepShell from "@/components/audit/StepShell";
import type { AuditPhoto, PhotoSlot } from "@/types/audit";

type PhotoUploadStepProps = {
  photos: AuditPhoto[];
  uploadingSlot: PhotoSlot | null;
  onBack: () => void;
  onSelectFile: (slot: PhotoSlot, file: File) => void;
  onRemovePhoto: (slot: PhotoSlot) => void;
  onNext: () => void;
};

const SLOTS: { slot: PhotoSlot; label: string; reason: string }[] = [
  { slot: "front", label: "Front", reason: "Captures the overall shape" },
  { slot: "back", label: "Back", reason: "Captures any label or brand" },
  { slot: "bottom", label: "Bottom", reason: "Where the recycling symbol usually is" },
];

function PhotoSlotCard({
  slot,
  label,
  reason,
  photo,
  isUploading,
  onSelectFile,
  onRemovePhoto,
}: {
  slot: PhotoSlot;
  label: string;
  reason: string;
  photo: AuditPhoto | undefined;
  isUploading: boolean;
  onSelectFile: (slot: PhotoSlot, file: File) => void;
  onRemovePhoto: (slot: PhotoSlot) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onSelectFile(slot, file);
    e.target.value = "";
  }

  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-gray-500">{reason}</p>
        </div>
        {photo && !isUploading && (
          <button
            type="button"
            onClick={() => onRemovePhoto(slot)}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mt-4">
        {isUploading ? (
          <div className="w-full h-40 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
            Uploading...
          </div>
        ) : photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.previewUrl}
            alt={`${label} of item`}
            className="w-full h-40 object-cover rounded-xl"
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600 transition flex flex-col items-center justify-center gap-2"
          >
            <span className="text-3xl">📷</span>
            <span className="text-sm font-medium">Upload {label.toLowerCase()} photo</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

export default function PhotoUploadStep({
  photos,
  uploadingSlot,
  onBack,
  onSelectFile,
  onRemovePhoto,
  onNext,
}: PhotoUploadStepProps) {
  const hasFrontPhoto = photos.some((p) => p.slot === "front" && p.storageUrl);

  return (
    <StepShell
      eyebrow="Unidentified plastic"
      title="Add photos so it can be identified later"
      description="Since nobody knows the type, this gets logged for review. A clear front photo is required - back and bottom (where the recycling number usually is) help a lot too."
      onBack={onBack}
    >
      <div className="space-y-5">
        {SLOTS.map((s) => (
          <PhotoSlotCard
            key={s.slot}
            slot={s.slot}
            label={s.label}
            reason={s.reason}
            photo={photos.find((p) => p.slot === s.slot)}
            isUploading={uploadingSlot === s.slot}
            onSelectFile={onSelectFile}
            onRemovePhoto={onRemovePhoto}
          />
        ))}
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={onNext} disabled={!hasFrontPhoto} size="lg" className="w-full">
          Continue
        </PrimaryButton>
        {!hasFrontPhoto && (
          <p className="text-sm text-gray-500 text-center mt-3">
            At least a front photo is required to log this item for review.
          </p>
        )}
      </div>
    </StepShell>
  );
}
