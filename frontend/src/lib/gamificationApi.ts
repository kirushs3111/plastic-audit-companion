import { api } from "@/lib/apiClient";

export interface ApiHunt {
  plastic_code: number;
  abbreviation: string;
  target: number;
  progress: number;
  completed: boolean;
}

export interface ApiHuntsResponse {
  hunts: ApiHunt[];
}

export async function getMyHunts(token: string): Promise<ApiHuntsResponse> {
  return api.get<ApiHuntsResponse>("/api/hunts", token);
}

export interface ApiBadge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  earned: boolean;
  progress: number;
  target: number;
}

export interface ApiBadgesResponse {
  badges: ApiBadge[];
}

export async function getMyBadges(token: string): Promise<ApiBadgesResponse> {
  return api.get<ApiBadgesResponse>("/api/badges", token);
}

export interface ApiPassportMonthEntry {
  plastic_code: number;
  quantity: number;
}

export interface ApiPassportMonth {
  month: string;
  total_items: number;
  by_plastic_type: ApiPassportMonthEntry[];
}

export interface ApiHouseholdPassport {
  household_id: string;
  household_name: string;
  months: ApiPassportMonth[];
}

export async function getHouseholdPassport(
  token: string,
  householdId: string
): Promise<ApiHouseholdPassport> {
  return api.get<ApiHouseholdPassport>(`/api/households/${householdId}/passport`, token);
}
