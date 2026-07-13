import { api } from "@/lib/apiClient";
import type { ApiPlasticEntry } from "@/types/api";

export interface ApiPlasticTypeCount {
  plastic_code: number;
  count: number;
  total_quantity: number;
}

export interface ApiRoomCount {
  room: string;
  count: number;
  total_quantity: number;
}

export interface ApiAdminOverview {
  total_users: number;
  total_households: number;
  total_audit_sessions: number;
  submitted_audit_sessions: number;
  total_entries: number;
  total_items: number;
  pending_review_count: number;
  by_plastic_type: ApiPlasticTypeCount[];
  by_room: ApiRoomCount[];
}

export async function getAdminOverview(token: string): Promise<ApiAdminOverview> {
  return api.get<ApiAdminOverview>("/api/admin/overview", token);
}

export async function downloadCsvExport(token: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const res = await fetch(`${base}/api/admin/export.csv`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Export failed");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plastic_audit_export.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadPhotosZip(token: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const res = await fetch(`${base}/api/admin/export-photos.zip`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Export failed");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plastic_audit_photos.zip";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function listReviewQueue(token: string): Promise<ApiPlasticEntry[]> {
  return api.get<ApiPlasticEntry[]>("/api/review-queue", token);
}

export async function assignPlasticType(
  token: string,
  entryId: string,
  plasticCode: number
): Promise<ApiPlasticEntry> {
  return api.post<ApiPlasticEntry>(
    `/api/review-queue/${entryId}/assign`,
    { plastic_code: plasticCode },
    token
  );
}
