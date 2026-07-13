import { api } from "@/lib/apiClient";
import type {
  ApiAuditSession,
  ApiAuditSessionSummary,
  ApiHousehold,
  ApiPhotoUploadResponse,
  ApiPlasticEntry,
} from "@/types/api";
import type { AuditPhoto, HouseholdInfo, ItemCategoryId, RoomId } from "@/types/audit";
import type { PlasticCode } from "@/types/plastic";

export async function getHousehold(token: string, householdId: string): Promise<ApiHousehold> {
  return api.get<ApiHousehold>(`/api/households/${householdId}`, token);
}

export async function listMyHouseholds(token: string): Promise<ApiHousehold[]> {
  return api.get<ApiHousehold[]>("/api/households", token);
}

export async function createHousehold(
  token: string,
  household: HouseholdInfo
): Promise<ApiHousehold> {
  return api.post<ApiHousehold>(
    "/api/households",
    {
      household_name: household.householdName,
      address: household.address,
      city: household.city,
      number_of_residents: household.numberOfResidents,
    },
    token
  );
}

export async function createAuditSession(
  token: string,
  householdId: string
): Promise<ApiAuditSession> {
  return api.post<ApiAuditSession>(
    "/api/audit-sessions",
    { household_id: householdId },
    token
  );
}

export async function listMyAuditSessions(token: string): Promise<ApiAuditSessionSummary[]> {
  return api.get<ApiAuditSessionSummary[]>("/api/audit-sessions", token);
}

export async function uploadPhotoFile(token: string, file: File): Promise<ApiPhotoUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return api.upload<ApiPhotoUploadResponse>("/api/photos/upload", formData, token);
}

interface AddEntryParams {
  room: RoomId;
  item: ItemCategoryId;
  identificationMethod: "known" | "pending-review";
  plasticCode: PlasticCode | null;
  quantity: number;
  photos: AuditPhoto[];
}

export async function addPlasticEntry(
  token: string,
  sessionId: string,
  params: AddEntryParams
): Promise<ApiPlasticEntry> {
  return api.post<ApiPlasticEntry>(
    `/api/audit-sessions/${sessionId}/entries`,
    {
      room: params.room,
      item: params.item,
      identification_method: params.identificationMethod,
      plastic_code: params.plasticCode,
      quantity: params.quantity,
      photos: params.photos
        .filter((p) => p.storageUrl)
        .map((p) => ({
          slot: p.slot,
          storage_url: p.storageUrl,
          original_filename: p.fileName,
        })),
    },
    token
  );
}

export async function deletePlasticEntry(
  token: string,
  sessionId: string,
  entryId: string
): Promise<void> {
  return api.del<void>(`/api/audit-sessions/${sessionId}/entries/${entryId}`, token);
}

export async function submitAuditSession(
  token: string,
  sessionId: string
): Promise<ApiAuditSession> {
  return api.post<ApiAuditSession>(`/api/audit-sessions/${sessionId}/submit`, undefined, token);
}

export async function getAuditSession(token: string, sessionId: string): Promise<ApiAuditSession> {
  return api.get<ApiAuditSession>(`/api/audit-sessions/${sessionId}`, token);
}
