"use client";

import { useCallback, useEffect, useReducer } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  addPlasticEntry,
  createAuditSession,
  createHousehold,
  deletePlasticEntry,
  getAuditSession,
  getHousehold,
  submitAuditSession,
  uploadPhotoFile,
} from "@/lib/auditApi";
import { ApiError } from "@/lib/apiClient";
import { compressImage } from "@/lib/imageCompression";
import type { PlasticCode } from "@/types/plastic";
import type {
  AuditPhoto,
  HouseholdInfo,
  ItemCategoryId,
  PlasticEntry,
  RoomId,
} from "@/types/audit";

export type AuditPhase =
  | "welcome"
  | "house-info"
  | "room-select"
  | "item-select"
  | "know-type"
  | "known-type-pick"
  | "photo-upload"
  | "quantity"
  | "summary"
  | "submitted";

interface AuditFlowState {
  phase: AuditPhase;
  household: HouseholdInfo;
  householdId: string | null;
  sessionId: string | null;
  entries: PlasticEntry[];
  submittedAt: string | null;
  currentRoom: RoomId | null;
  currentItem: ItemCategoryId | null;
  currentPhotos: AuditPhoto[];
  currentPlasticCode: PlasticCode | null;
  currentMethod: "known" | "pending-review" | null;
  isSaving: boolean;
  isUploadingSlot: AuditPhoto["slot"] | null;
  error: string | null;
}

type Action =
  | { type: "GO_TO"; phase: AuditPhase }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_SAVING"; isSaving: boolean }
  | { type: "SET_UPLOADING"; slot: AuditPhoto["slot"] | null }
  | { type: "HOUSEHOLD_CREATED"; household: HouseholdInfo; householdId: string; sessionId: string }
  | {
      type: "RESUMED";
      household: HouseholdInfo;
      householdId: string;
      sessionId: string;
      entries: PlasticEntry[];
    }
  | { type: "SELECT_ROOM"; room: RoomId }
  | { type: "SELECT_ITEM"; item: ItemCategoryId }
  | { type: "CHOOSE_KNOWN_TYPE"; code: PlasticCode }
  | { type: "CHOOSE_UNKNOWN" }
  | { type: "PHOTO_UPLOADED"; photo: AuditPhoto }
  | { type: "REMOVE_PHOTO"; slot: AuditPhoto["slot"] }
  | { type: "CONTINUE_TO_QUANTITY" }
  | { type: "ENTRY_SAVED"; entry: PlasticEntry }
  | { type: "ENTRY_DELETED"; id: string }
  | { type: "ADD_ANOTHER_ITEM" }
  | { type: "CHANGE_ROOM" }
  | { type: "SUBMITTED"; submittedAt: string }
  | { type: "RESTART" };

function freshItemState(): Pick<
  AuditFlowState,
  "currentItem" | "currentPhotos" | "currentPlasticCode" | "currentMethod"
> {
  return {
    currentItem: null,
    currentPhotos: [],
    currentPlasticCode: null,
    currentMethod: null,
  };
}

function initState(): AuditFlowState {
  return {
    phase: "welcome",
    household: { householdName: "", address: "", city: "", numberOfResidents: null },
    householdId: null,
    sessionId: null,
    entries: [],
    submittedAt: null,
    currentRoom: null,
    ...freshItemState(),
    isSaving: false,
    isUploadingSlot: null,
    error: null,
  };
}

function reducer(state: AuditFlowState, action: Action): AuditFlowState {
  switch (action.type) {
    case "GO_TO":
      return { ...state, phase: action.phase, error: null };

    case "SET_ERROR":
      return { ...state, error: action.error, isSaving: false };

    case "SET_SAVING":
      return { ...state, isSaving: action.isSaving };

    case "SET_UPLOADING":
      return { ...state, isUploadingSlot: action.slot };

    case "HOUSEHOLD_CREATED":
      return {
        ...state,
        household: action.household,
        householdId: action.householdId,
        sessionId: action.sessionId,
        phase: "room-select",
        isSaving: false,
      };

    case "RESUMED":
      return {
        ...state,
        household: action.household,
        householdId: action.householdId,
        sessionId: action.sessionId,
        entries: action.entries,
        phase: "room-select",
        isSaving: false,
      };

    case "SELECT_ROOM":
      return { ...state, currentRoom: action.room, phase: "item-select" };

    case "SELECT_ITEM":
      return { ...state, currentItem: action.item, phase: "know-type" };

    case "CHOOSE_KNOWN_TYPE":
      return {
        ...state,
        currentPlasticCode: action.code,
        currentMethod: "known",
        phase: "quantity",
      };

    case "CHOOSE_UNKNOWN":
      return {
        ...state,
        currentPlasticCode: null,
        currentMethod: "pending-review",
        phase: "photo-upload",
      };

    case "PHOTO_UPLOADED":
      return {
        ...state,
        currentPhotos: [
          ...state.currentPhotos.filter((p) => p.slot !== action.photo.slot),
          action.photo,
        ],
        isUploadingSlot: null,
      };

    case "REMOVE_PHOTO":
      return {
        ...state,
        currentPhotos: state.currentPhotos.filter((p) => p.slot !== action.slot),
      };

    case "CONTINUE_TO_QUANTITY":
      return { ...state, phase: "quantity" };

    case "ENTRY_SAVED":
      return {
        ...state,
        entries: [...state.entries, action.entry],
        ...freshItemState(),
        phase: "item-select",
        isSaving: false,
      };

    case "ENTRY_DELETED":
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id) };

    case "ADD_ANOTHER_ITEM":
      return { ...state, ...freshItemState(), phase: "item-select" };

    case "CHANGE_ROOM":
      return { ...state, ...freshItemState(), currentRoom: null, phase: "room-select" };

    case "SUBMITTED":
      return { ...state, submittedAt: action.submittedAt, phase: "submitted", isSaving: false };

    case "RESTART":
      return initState();

    default:
      return state;
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return typeof err.detail === "string" ? err.detail : "Something went wrong. Please try again.";
  }
  return "Could not reach the server. Check your connection and try again.";
}

/**
 * Owns audit-flow state and talks to the real backend: creating the
 * household + session, uploading photos, saving entries, and submitting.
 * Requires the caller to be authenticated (guest or registered) - see
 * AuditFlow.tsx, which redirects to /login if there's no token yet.
 */
export function useAuditFlow(resumeSessionId?: string | null) {
  const { token } = useAuth();
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  useEffect(() => {
    if (!resumeSessionId || !token) return;
    dispatch({ type: "SET_SAVING", isSaving: true });
    (async () => {
      try {
        const session = await getAuditSession(token, resumeSessionId);
        const household = await getHousehold(token, session.household_id);
        dispatch({
          type: "RESUMED",
          household: {
            householdName: household.household_name,
            address: household.address,
            city: household.city,
            numberOfResidents: household.number_of_residents,
          },
          householdId: household.id,
          sessionId: session.id,
          entries: session.entries.map((e) => ({
            id: e.id,
            room: e.room as PlasticEntry["room"],
            item: e.item as PlasticEntry["item"],
            plasticCode: e.plastic_code as PlasticCode | null,
            quantity: e.quantity,
            identificationMethod: e.identification_method,
            needsReview: e.needs_review,
            photos: e.photos.map((p) => ({
              slot: p.slot,
              fileName: p.original_filename || "",
              previewUrl: p.storage_url,
              storageUrl: p.storage_url,
            })),
            createdAt: e.created_at,
          })),
        });
      } catch (err) {
        dispatch({ type: "SET_ERROR", error: errorMessage(err) });
      }
    })();
    // Only run once per resumeSessionId - token changes shouldn't re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeSessionId]);

  const submitHouseInfo = useCallback(
    async (household: HouseholdInfo) => {
      if (!token) {
        dispatch({ type: "SET_ERROR", error: "You need to sign in first." });
        return;
      }
      dispatch({ type: "SET_SAVING", isSaving: true });
      try {
        const apiHousehold = await createHousehold(token, household);
        const apiSession = await createAuditSession(token, apiHousehold.id);
        dispatch({
          type: "HOUSEHOLD_CREATED",
          household,
          householdId: apiHousehold.id,
          sessionId: apiSession.id,
        });
      } catch (err) {
        dispatch({ type: "SET_ERROR", error: errorMessage(err) });
      }
    },
    [token]
  );

  const uploadPhoto = useCallback(
    async (slot: AuditPhoto["slot"], file: File) => {
      if (!token) return;
      dispatch({ type: "SET_UPLOADING", slot });
      try {
        // Resize/re-encode before anything else touches the file - a
        // phone camera photo can be 10-30MB, and holding that at full
        // size for both the preview and the upload can genuinely run a
        // lower-RAM device out of memory. The compressed version is used
        // for both.
        const compressed = await compressImage(file);
        const previewUrl = URL.createObjectURL(compressed);
        const result = await uploadPhotoFile(token, compressed);
        dispatch({
          type: "PHOTO_UPLOADED",
          photo: {
            slot,
            fileName: compressed.name,
            previewUrl,
            storageUrl: result.storage_url,
          },
        });
      } catch (err) {
        dispatch({ type: "SET_UPLOADING", slot: null });
        dispatch({ type: "SET_ERROR", error: errorMessage(err) });
      }
    },
    [token]
  );

  const saveEntry = useCallback(
    async (quantity: number) => {
      if (!token || !state.sessionId || !state.currentRoom || !state.currentItem || !state.currentMethod) {
        return;
      }
      dispatch({ type: "SET_SAVING", isSaving: true });
      try {
        const apiEntry = await addPlasticEntry(token, state.sessionId, {
          room: state.currentRoom,
          item: state.currentItem,
          identificationMethod: state.currentMethod,
          plasticCode: state.currentPlasticCode,
          quantity,
          photos: state.currentPhotos,
        });
        dispatch({
          type: "ENTRY_SAVED",
          entry: {
            id: apiEntry.id,
            room: state.currentRoom,
            item: state.currentItem,
            plasticCode: apiEntry.plastic_code as PlasticCode | null,
            quantity: apiEntry.quantity,
            identificationMethod: apiEntry.identification_method,
            needsReview: apiEntry.needs_review,
            photos: state.currentPhotos,
            createdAt: apiEntry.created_at,
          },
        });
      } catch (err) {
        dispatch({ type: "SET_ERROR", error: errorMessage(err) });
      }
    },
    [token, state.sessionId, state.currentRoom, state.currentItem, state.currentMethod, state.currentPlasticCode, state.currentPhotos]
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      if (!token || !state.sessionId) return;
      try {
        await deletePlasticEntry(token, state.sessionId, entryId);
        dispatch({ type: "ENTRY_DELETED", id: entryId });
      } catch (err) {
        dispatch({ type: "SET_ERROR", error: errorMessage(err) });
      }
    },
    [token, state.sessionId]
  );

  const submit = useCallback(async () => {
    if (!token || !state.sessionId) return;
    dispatch({ type: "SET_SAVING", isSaving: true });
    try {
      const result = await submitAuditSession(token, state.sessionId);
      dispatch({ type: "SUBMITTED", submittedAt: result.submitted_at ?? new Date().toISOString() });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: errorMessage(err) });
    }
  }, [token, state.sessionId]);

  return {
    state,
    dispatch,
    actions: { submitHouseInfo, uploadPhoto, saveEntry, deleteEntry, submit },
  };
}
