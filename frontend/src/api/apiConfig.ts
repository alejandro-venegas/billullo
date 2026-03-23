import type { ApiConfig } from "./http-client";
import { Auth } from "./Auth";
import { Categories } from "./Categories";
import { Transactions } from "./Transactions";
import { Rules } from "./Rules";
import { EmailConfig } from "./EmailConfig";
import { EmailParsingRules } from "./EmailParsingRules";
import { Accounts } from "./Accounts";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem("billullo_refresh_token", refresh);
}

export function getRefreshToken() {
  return refreshToken || localStorage.getItem("billullo_refresh_token");
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("billullo_refresh_token");
}

export function getAccessToken(): string {
  return accessToken ?? "";
}

export function hasStoredRefreshToken(): boolean {
  return !!localStorage.getItem("billullo_refresh_token");
}

async function tryRefreshToken(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const response = await fetch("/api/Auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.token, data.refreshToken);
      return true;
    }

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

const authFetch: typeof fetch = async (input, init) => {
  if (accessToken) {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    init = { ...init, headers };
  }

  let response = await fetch(input, init);

  if (response.status === 401 && getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefreshToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${accessToken}`);
      response = await fetch(input, { ...init, headers });
    }
  }

  return response;
};

const apiConfig: ApiConfig = {
  baseUrl: "",
  customFetch: authFetch,
};

export const authApi = new Auth(apiConfig);
export const categoriesApi = new Categories(apiConfig);
export const transactionsApi = new Transactions(apiConfig);
export const rulesApi = new Rules(apiConfig);
export const emailConfigApi = new EmailConfig(apiConfig);
export const emailParsingRulesApi = new EmailParsingRules(apiConfig);
export const accountsApi = new Accounts(apiConfig);
