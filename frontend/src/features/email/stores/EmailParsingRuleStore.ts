import { makeAutoObservable, runInAction } from "mobx";
import { emailParsingRulesApi } from "@/api/apiConfig";
import type { EmailParsingRuleDto } from "@/api/data-contracts";
import { withLoading } from "@/shared/stores/storeUtils";

export class EmailParsingRuleStore {
  rules: EmailParsingRuleDto[] = [];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async loadFromApi() {
    await withLoading(this, async () => {
      const data = await emailParsingRulesApi.emailParsingRulesGetAll();
      this.rules = data ?? [];
    });
  }

  async addRule(input: {
    name: string;
    senderAddress: string | null;
    subjectPattern: string | null;
    currencyFixed: string | null;
    descriptionFixed: string | null;
    transactionType: string;
    categoryId: number | string | null;
    priority?: number;
  }) {
    const data = await emailParsingRulesApi.emailParsingRulesCreate(input);
    runInAction(() => {
      this.rules.push(data);
    });
  }

  async updateRule(
    id: number | string,
    input: {
      name: string;
      senderAddress: string | null;
      subjectPattern: string | null;
      currencyFixed: string | null;
      descriptionFixed: string | null;
      transactionType: string;
      categoryId: number | string | null;
      priority?: number;
    },
  ) {
    const data = await emailParsingRulesApi.emailParsingRulesUpdate(id, input);
    runInAction(() => {
      const idx = this.rules.findIndex((r) => r.id === id);
      if (idx !== -1) this.rules[idx] = data;
    });
  }

  async deleteRule(id: number | string) {
    await emailParsingRulesApi.emailParsingRulesDelete(id);
    runInAction(() => {
      this.rules = this.rules.filter((r) => r.id !== id);
    });
  }

  async testRule(input: {
    emailBody: string;
  }) {
    return await emailParsingRulesApi.emailParsingRulesTestRule(input);
  }
}
