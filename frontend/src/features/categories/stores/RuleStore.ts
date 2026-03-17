import { makeAutoObservable, runInAction, computed } from "mobx";
import { rulesApi } from "@/api/apiConfig";
import type { CategoryRuleDto, RuleMatchResult } from "@/api/data-contracts";
import { withLoading } from "@/shared/stores/storeUtils";

export class RuleStore {
  rules: CategoryRuleDto[] = [];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {
      rulesByCategoryId: computed({ keepAlive: true }),
    });
  }

  async loadFromApi() {
    await withLoading(this, async () => {
      const data = await rulesApi.rulesGetAll();
      this.rules = data ?? [];
    });
  }

  get rulesByCategoryId(): Map<string, CategoryRuleDto[]> {
    const map = new Map<string, CategoryRuleDto[]>();
    for (const r of this.rules) {
      const key = String(r.categoryId);
      let arr = map.get(key);
      if (!arr) {
        arr = [];
        map.set(key, arr);
      }
      arr.push(r);
    }
    return map;
  }

  getRulesForCategory(categoryId: number | string): CategoryRuleDto[] {
    return this.rulesByCategoryId.get(String(categoryId)) ?? [];
  }

  async matchCategory(description: string): Promise<RuleMatchResult> {
    const empty: RuleMatchResult = {
      categoryId: null,
      categoryName: null,
      conflicts: false,
      matches: [],
    };
    if (!description.trim()) return empty;

    try {
      return await rulesApi.rulesMatch({ description });
    } catch {
      return empty;
    }
  }

  async addRule(pattern: string, categoryId: number | string) {
    const data = await rulesApi.rulesCreate({
      pattern: pattern.trim(),
      categoryId,
    });
    runInAction(() => {
      this.rules.push(data);
    });
  }

  async updateRule(
    id: number | string,
    patch: { pattern?: string; categoryId?: number | string },
  ) {
    const existing = this.rules.find((r) => r.id === id);
    if (!existing) return;

    const data = await rulesApi.rulesUpdate(id, {
      pattern: patch.pattern ?? existing.pattern,
      categoryId: patch.categoryId ?? existing.categoryId,
    });
    runInAction(() => {
      const idx = this.rules.findIndex((r) => r.id === id);
      if (idx !== -1) this.rules[idx] = data;
    });
  }

  async deleteRule(id: number | string) {
    await rulesApi.rulesDelete(id);
    runInAction(() => {
      this.rules = this.rules.filter((r) => r.id !== id);
    });
  }

  removeRulesForCategory(categoryId: number | string) {
    this.rules = this.rules.filter((r) => String(r.categoryId) !== String(categoryId));
  }
}
