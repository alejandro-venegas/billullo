import { makeAutoObservable, runInAction } from "mobx";
import { authApi } from "@/api/apiConfig";

export class PreferenceStore {
  preferredCurrency = "USD";
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async loadFromApi() {
    this.isLoading = true;
    try {
      const user = await authApi.authGetPreferences();
      runInAction(() => {
        this.preferredCurrency = user.preferredCurrency ?? "USD";
        this.isLoading = false;
      });
    } catch {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async setPreferredCurrency(currency: string) {
    const previous = this.preferredCurrency;
    this.preferredCurrency = currency;

    try {
      await authApi.authUpdatePreferences({ preferredCurrency: currency });
    } catch {
      runInAction(() => {
        this.preferredCurrency = previous;
      });
    }
  }
}
