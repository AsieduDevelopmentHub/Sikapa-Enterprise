import { apiFetchJson, apiFetchJsonAuth, getApiV1Base } from "@/lib/api/client";
import { V1 } from "@/lib/api/v1-paths";

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
  is_admin: boolean;
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

export class TwoFactorRequiredError extends Error {
  override name = "TwoFactorRequiredError";
  constructor() {
    super("two_factor_required");
  }
}

export async function authLogin(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${getApiV1Base()}${V1.auth.login}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 403) {
    const raw = await res.text();
    let need2fa = raw.includes("two_factor_required");
    if (!need2fa) {
      try {
        const j = JSON.parse(raw) as { detail?: unknown };
        const d = j.detail;
        need2fa =
          d === "two_factor_required" ||
          (Array.isArray(d) && d.some((x) => String(x).includes("two_factor_required")));
      } catch {
        /* ignore */
      }
    }
    if (need2fa) throw new TwoFactorRequiredError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export async function authRegister(
  email: string,
  password: string,
  first_name?: string,
  last_name?: string
): Promise<RegisterUserResponse> {
  return apiFetchJson<RegisterUserResponse>(V1.auth.register, {
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
  return apiFetchJsonAuth<UserProfile>(accessToken, V1.auth.profile);
}

export async function authLogout(accessToken: string): Promise<void> {
  await apiFetchJsonAuth<{ message: string }>(accessToken, V1.auth.logout, {
    method: "POST",
  });
}

export async function authLoginWith2FA(
  email: string,
  password: string,
  code: string
): Promise<TokenResponse> {
  return apiFetchJson<TokenResponse>(V1.auth.login2fa, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, code }),
  });
}

export async function authRefresh(refreshToken: string): Promise<TokenResponse> {
  return apiFetchJson<TokenResponse>(V1.auth.refresh, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export type TwoFASetupResponse = {
  secret: string;
  qr_code: string;
  backup_codes: string[];
};

export async function authTwoFaSetup(accessToken: string): Promise<TwoFASetupResponse> {
  return apiFetchJsonAuth<TwoFASetupResponse>(accessToken, V1.auth.twoFaSetup, {
    method: "POST",
  });
}

export async function authTwoFaEnable(
  accessToken: string,
  body: { secret: string; backup_codes: string[]; verification_code: string }
): Promise<{ message: string; two_fa_enabled: boolean; two_fa_method?: string | null }> {
  return apiFetchJsonAuth(accessToken, V1.auth.twoFaEnable, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function authTwoFaDisable(
  accessToken: string,
  password: string
): Promise<{ message: string; two_fa_enabled: boolean }> {
  return apiFetchJsonAuth(accessToken, V1.auth.twoFaDisable, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export async function authVerifyEmail(email: string, code: string): Promise<{
  message: string;
  email: string;
  verified: boolean;
}> {
  return apiFetchJson(V1.auth.verifyEmail, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
}

export async function authUpdateProfile(
  accessToken: string,
  body: { first_name?: string | null; last_name?: string | null; phone?: string | null }
): Promise<UserProfile> {
  return apiFetchJsonAuth<UserProfile>(accessToken, V1.auth.profilePut, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function authChangePassword(
  accessToken: string,
  current_password: string,
  new_password: string
): Promise<{ message: string }> {
  return apiFetchJsonAuth<{ message: string }>(accessToken, V1.auth.passwordChange, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password, new_password }),
  });
}

export async function authPasswordResetRequest(email: string): Promise<{ message: string }> {
  return apiFetchJson<{ message: string }>(V1.auth.passwordResetRequest, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function authPasswordResetConfirm(
  token: string,
  new_password: string
): Promise<{ message: string; email: string }> {
  return apiFetchJson<{ message: string; email: string }>(V1.auth.passwordResetConfirm, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password }),
  });
}

export async function authDeleteAccount(accessToken: string, password: string): Promise<{ message: string }> {
  return apiFetchJsonAuth<{ message: string }>(accessToken, V1.auth.accountDelete, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}
