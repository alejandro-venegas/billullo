import { makeAutoObservable, runInAction } from "mobx";
import { emailConfigApi } from "@/api/apiConfig";
import type { EmailConfigDto, TestConnectionResult } from "@/api/data-contracts";
import { withLoading } from "@/shared/stores/storeUtils";

export class EmailConfigStore {
  config: EmailConfigDto | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async loadFromApi() {
    await withLoading(this, async () => {
      this.config = await emailConfigApi.emailConfigGet();
    });
  }

  async save(input: {
    imapHost: string;
    imapPort: number;
    emailAddress: string;
    password: string | null;
    useSsl: boolean;
    enabled: boolean;
  }) {
    const data = await emailConfigApi.emailConfigUpsert(input);
    runInAction(() => {
      this.config = data;
    });
  }

  async testConnection(input: {
    imapHost: string;
    imapPort: number;
    emailAddress: string;
    password: string;
    useSsl: boolean;
  }): Promise<TestConnectionResult> {
    return await emailConfigApi.emailConfigTestConnection(input);
  }

  async remove() {
    await emailConfigApi.emailConfigDelete();
    runInAction(() => {
      this.config = null;
    });
  }
}
