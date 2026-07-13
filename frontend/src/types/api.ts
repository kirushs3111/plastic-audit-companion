export interface ApiUser {
  id: string;
  email: string | null;
  display_name: string | null;
  is_guest: boolean;
  is_admin: boolean;
}

export interface ApiGuestSession {
  access_token: string;
  token_type: string;
  user_id: string;
  is_guest: boolean;
}

export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
}

export interface ApiHousehold {
  id: string;
  household_name: string;
  address: string;
  city: string;
  number_of_residents: number | null;
  created_at: string;
}

export interface ApiPhoto {
  id: string;
  slot: "front" | "back" | "bottom";
  storage_url: string;
  original_filename: string | null;
}

export interface ApiPlasticEntry {
  id: string;
  room: string;
  item: string;
  plastic_code: number | null;
  quantity: number;
  identification_method: "known" | "pending-review";
  needs_review: boolean;
  user_confirmed: boolean;
  created_at: string;
  photos: ApiPhoto[];
}

export interface ApiAuditSession {
  id: string;
  household_id: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  entries: ApiPlasticEntry[];
}

export interface ApiAuditSessionSummary {
  id: string;
  household_id: string;
  submitted_at: string | null;
  updated_at: string;
  entry_count: number;
  total_items: number;
}

export interface ApiPhotoUploadResponse {
  storage_url: string;
  original_filename: string;
}
