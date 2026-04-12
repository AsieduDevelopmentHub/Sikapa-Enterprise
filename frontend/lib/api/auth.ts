import { apiFetchJson } from "@/lib/api/client";

export type TokenResponse = {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
  expires_in: number;
};

export type UserProfile = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email_verified: boolean;
  two_fa_enabled: boolean;
  two_fa_method?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RegisterUserResponse = {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  email_verified: boolean;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  two_fa_enabled: boolean;
};

export async function authLogin(email: string, password: string): Promise<TokenResponse> {
  return apiFetchJson<TokenResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function authRegister(
  email: string,
  password: string,
  first_name?: string,
  last_name?: string
): Promise<RegisterUserResponse> {
  return apiFetchJson<RegisterUserResponse>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      first_name: first_name || null,
      last_name: last_name || null,
    }),
  });
}

export async function authFetchProfile(accessToken: string): Promise<UserProfile> {
  return apiFetchJson<UserProfile>("/auth/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function authLogout(accessToken: string): Promise<void> {
  await apiFetchJson<{ message: string }>("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
