import { makeAutoObservable, runInAction } from "mobx";
import { authApi } from "@/api/apiConfig";
import { withLoading, extractErrorMessage } from "@/shared/stores/storeUtils";

export class PreferenceStore {
  preferredCurrency = "USD";
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async loadFromApi() {
    await withLoading(this, async () => {
      const user = await authApi.authGetPreferences();
      runInAction(() => {
        this.preferredCurrency = user.preferredCurrency ?? "USD";
      });
    });
  }

  async setPreferredCurrency(currency: string) {
    const previous = this.preferredCurrency;
    this.preferredCurrency = currency;

    try {
      await authApi.authUpdatePreferences({ preferredCurrency: currency });
    } catch (e) {
      runInAction(() => {
        this.preferredCurrency = previous;
        this.error = extractErrorMessage(e, "Failed to update currency");
      });
    }
  }
}
