import { makeAutoObservable, runInAction } from "mobx";
import {
  authApi,
  setTokens,
  clearTokens,
  getRefreshToken,
  hasStoredRefreshToken,
} from "@/api/apiConfig";
import type { UserDto } from "@/api/data-contracts";
import { extractErrorMessage } from "@/shared/stores/storeUtils";

export class AuthStore {
  user: UserDto | null = null;
  isAuthenticated = false;
  isLoading = false;
  isInitialized = false;
  error: string | null = null;

  private onAuthenticated: (() => void) | null = null;

  constructor() {
    makeAutoObservable<AuthStore, "onAuthenticated">(this, {
      onAuthenticated: false,
    });
  }

  /** Called by RootStore so data stores reload after login / refresh */
  setOnAuthenticated(cb: () => void) {
    this.onAuthenticated = cb;
  }

  async initialize() {
    if (this.isInitialized) return;

    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await this.refreshSession(refreshToken);
    }

    runInAction(() => {
      this.isInitialized = true;
    });
  }

  async login(email: string, password: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await authApi.authLogin({ email, password });
      setTokens(data.token, data.refreshToken);

      runInAction(() => {
        this.user = data.user;
        this.isAuthenticated = true;
        this.isLoading = false;
      });
      this.onAuthenticated?.();
      return true;
    } catch (e) {
      runInAction(() => {
        this.error = extractErrorMessage(e, "Login failed");
        this.isLoading = false;
      });
      return false;
    }
  }

  async register(email: string, password: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await authApi.authRegister({ email, password });
      setTokens(data.token, data.refreshToken);

      runInAction(() => {
        this.user = data.user;
        this.isAuthenticated = true;
        this.isLoading = false;
      });
      this.onAuthenticated?.();
      return true;
    } catch (e) {
      runInAction(() => {
        this.error = extractErrorMessage(e, "Registration failed");
        this.isLoading = false;
      });
      return false;
    }
  }

  async logout() {
    const rt = getRefreshToken();
    if (rt) {
      try {
        await authApi.authLogout({ refreshToken: rt });
      } catch {
        // Ignore errors on logout
      }
    }

    clearTokens();
    runInAction(() => {
      this.user = null;
      this.isAuthenticated = false;
    });
  }

  private async refreshSession(refreshToken: string) {
    try {
      const data = await authApi.authRefresh({ refreshToken });
      setTokens(data.token, data.refreshToken);

      runInAction(() => {
        this.user = data.user;
        this.isAuthenticated = true;
      });
      this.onAuthenticated?.();
    } catch {
      clearTokens();
    }
  }

  get hasStoredSession(): boolean {
    return hasStoredRefreshToken();
  }
}
