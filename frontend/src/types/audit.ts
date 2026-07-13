import type { PlasticCode } from "@/types/plastic";

export type RoomId =
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "living-room"
  | "garden"
  | "garage"
  | "other";

export interface Room {
  id: RoomId;
  label: string;
  emoji: string;
}

export type ItemCategoryId =
  | "bottle"
  | "bag"
  | "chair"
  | "bucket"
  | "lunch-box"
  | "toy"
  | "container"
  | "pipe"
  | "other";

export interface ItemCategory {
  id: ItemCategoryId;
  label: string;
  emoji: string;
}

export type PhotoSlot = "front" | "back" | "bottom";

/**
 * Client-side representation of an uploaded photo. `previewUrl` is an
 * in-memory object URL for immediate display; once the entry is saved to
 * the backend, `storageUrl` holds the persisted path returned by
 * POST /api/photos/upload.
 */
export interface AuditPhoto {
  slot: PhotoSlot;
  fileName: string;
  previewUrl: string;
  storageUrl?: string;
}

/**
 * One row of the audit.
 *
 * - `identificationMethod: "known"` - the person told us the type directly,
 *   `plasticCode` is always set.
 * - `identificationMethod: "pending-review"` - nobody knew the type, so it
 *   was logged with photos only. `plasticCode` is null until a reviewer
 *   assigns one (Module 6's Photo Review queue).
 */
export interface PlasticEntry {
  id: string;
  room: RoomId;
  item: ItemCategoryId;
  plasticCode: PlasticCode | null;
  quantity: number;
  identificationMethod: "known" | "pending-review";
  photos: AuditPhoto[];
  needsReview: boolean;
  createdAt: string; // ISO timestamp
}

export interface HouseholdInfo {
  householdName: string;
  address: string;
  city: string;
  numberOfResidents: number | null;
}
