import { makeAutoObservable, runInAction, computed } from "mobx";
import { categoriesApi } from "@/api/apiConfig";
import type { CategoryDto } from "@/api/data-contracts";
import type { RootStore } from "@/app/stores/RootStore";
import { withLoading } from "@/shared/stores/storeUtils";

export class CategoryStore {
  categories: CategoryDto[] = [];
  isLoading = false;
  error: string | null = null;
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable<CategoryStore, "rootStore">(this, {
      rootStore: false,
      byId: computed({ keepAlive: true }),
      childrenByParent: computed({ keepAlive: true }),
      rootCategories: computed({ keepAlive: true }),
      flatTree: computed({ keepAlive: true }),
    });
  }

  async loadFromApi() {
    await withLoading(this, async () => {
      const data = await categoriesApi.categoriesList();
      this.categories = data ?? [];
    });
  }

  /** O(1) lookup index: id → CategoryDto */
  get byId(): Map<string, CategoryDto> {
    const map = new Map<string, CategoryDto>();
    for (const c of this.categories) map.set(String(c.id), c);
    return map;
  }

  /** O(1) children index: parentId → sorted children */
  get childrenByParent(): Map<string | null, CategoryDto[]> {
    const map = new Map<string | null, CategoryDto[]>();
    for (const c of this.categories) {
      const key = c.parentCategoryId == null ? null : String(c.parentCategoryId);
      let arr = map.get(key);
      if (!arr) {
        arr = [];
        map.set(key, arr);
      }
      arr.push(c);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }

  get rootCategories(): CategoryDto[] {
    return this.childrenByParent.get(null) ?? [];
  }

  get sortedCategories(): CategoryDto[] {
    return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  getCategoryById(id: number | string): CategoryDto | undefined {
    return this.byId.get(String(id));
  }

  getChildren(parentId: number | string): CategoryDto[] {
    return this.childrenByParent.get(String(parentId)) ?? [];
  }

  getAncestors(categoryId: number | string): CategoryDto[] {
    const ancestors: CategoryDto[] = [];
    let current = this.getCategoryById(categoryId);
    while (current?.parentCategoryId != null) {
      const parent = this.getCategoryById(current.parentCategoryId);
      if (!parent) break;
      ancestors.unshift(parent);
      current = parent;
    }
    return ancestors;
  }

  getRootColor(categoryId: number | string): string | null {
    let current = this.getCategoryById(categoryId);
    while (current) {
      if (current.parentCategoryId == null) return current.color ?? null;
      current = this.getCategoryById(current.parentCategoryId);
    }
    return null;
  }

  getCategoryName(id: number | string): string {
    return this.getCategoryById(id)?.name ?? "Unknown";
  }

  get flatTree(): { category: CategoryDto; depth: number }[] {
    const result: { category: CategoryDto; depth: number }[] = [];
    const walk = (parentId: string | null, depth: number) => {
      const children = parentId == null
        ? this.rootCategories
        : this.getChildren(parentId);
      for (const cat of children) {
        result.push({ category: cat, depth });
        walk(String(cat.id), depth + 1);
      }
    };
    walk(null, 0);
    return result;
  }

  async addCategory(
    name: string,
    parentCategoryId?: number | string | null,
    color?: string | null,
  ) {
    const data = await categoriesApi.categoriesCreate({
      name: name.trim(),
      parentCategoryId: parentCategoryId ?? null,
      color: color ?? null,
    });
    runInAction(() => {
      this.categories.push(data);
    });
  }

  async updateCategory(
    id: number | string,
    name: string,
    color?: string | null,
  ) {
    const data = await categoriesApi.categoriesUpdate(id, {
      name: name.trim(),
      color: color,
    });
    runInAction(() => {
      const idx = this.categories.findIndex(
        (c) => String(c.id) === String(id),
      );
      if (idx !== -1) this.categories[idx] = data;
    });
  }

  async deleteCategory(id: number | string) {
    await categoriesApi.categoriesDelete(id);
    runInAction(() => {
      const idsToRemove = new Set<string>();
      const collect = (catId: string) => {
        idsToRemove.add(catId);
        for (const child of this.getChildren(catId)) {
          collect(String(child.id));
        }
      };
      collect(String(id));
      this.categories = this.categories.filter(
        (c) => !idsToRemove.has(String(c.id)),
      );
    });
    this.rootStore.ruleStore.removeRulesForCategory(id);
  }

  isCategoryInUse(id: number | string): boolean {
    const cat = this.getCategoryById(id);
    return Number(cat?.transactionCount ?? 0) > 0;
  }
}
