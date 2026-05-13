export interface LoginIdentitySettings {
  loginDomain: string;
  usernameMinLength: number;
  usernameMaxLength: number;
  usernamePattern?: string | null;
  reservedUsernames: string[];
  status?: "active" | "inactive" | "draft" | null;
  isConfigured: boolean;
  updatedAt?: string | null;
}

export interface LoginIdentitySettingsResponse {
  loginDomain: string;
  usernameMinLength?: number | null;
  usernameMaxLength?: number | null;
  usernamePattern?: string | null;
  reservedUsernames?: string[] | null;
  status?: "active" | "inactive" | "draft" | null;
  isConfigured?: boolean | null;
  updatedAt?: string | null;
}

export interface UpdateLoginIdentityRequest {
  loginDomain: string;
  usernameMinLength?: number;
  usernameMaxLength?: number;
  usernamePattern?: string;
  reservedUsernames?: string[];
  status?: "active" | "inactive" | "draft";
}

export interface UsernamePreviewResponse {
  username: string;
  email: string;
  loginEmail?: string | null;
  isAvailable?: boolean | null;
  reason?: string | null;
}

export interface UsernameAvailabilityResponse {
  username: string;
  available?: boolean | null;
  isAvailable?: boolean | null;
  reason?: string | null;
}
