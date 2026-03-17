import { makeAutoObservable } from "mobx";
import { transactionsApi } from "@/api/apiConfig";
import type { TransactionDto } from "@/api/data-contracts";
import { withLoading } from "@/shared/stores/storeUtils";

export class TransactionStore {
  transactions: TransactionDto[] = [];
  isLoading = false;
  error: string | null = null;
  totalCount = 0;
  page = 1;
  pageSize = 25;

  typeFilter: "all" | "expense" | "income" = "all";
  startDate: string | null = null;
  endDate: string | null = null;
  search = "";

  constructor() {
    makeAutoObservable(this);
  }

  setFilters(filters: {
    typeFilter?: "all" | "expense" | "income";
    startDate?: string | null;
    endDate?: string | null;
    search?: string;
  }) {
    if (filters.typeFilter !== undefined) this.typeFilter = filters.typeFilter;
    if (filters.startDate !== undefined) this.startDate = filters.startDate;
    if (filters.endDate !== undefined) this.endDate = filters.endDate;
    if (filters.search !== undefined) this.search = filters.search;
    this.page = 1;
  }

  setPage(page: number) {
    this.page = page;
  }

  setPageSize(pageSize: number) {
    this.pageSize = pageSize;
    this.page = 1;
  }

  async loadFromApi(targetCurrency?: string) {
    await withLoading(this, async () => {
      const data = await transactionsApi.transactionsGetAll({
        page: this.page,
        pageSize: this.pageSize,
        type: this.typeFilter !== "all" ? this.typeFilter : undefined,
        startDate: this.startDate ?? undefined,
        endDate: this.endDate ?? undefined,
        search: this.search || undefined,
        targetCurrency: targetCurrency || undefined,
      });
      this.transactions = data.items ?? [];
      this.totalCount = Number(data.totalCount ?? 0);
    });
  }

  async addTransaction(input: {
    date: string;
    description: string;
    categoryId: number | null;
    amount: number;
    currency: string;
    type: string;
  }) {
    await transactionsApi.transactionsCreate(input);
    await this.loadFromApi();
  }

  async updateTransaction(
    id: number | string,
    input: {
      date: string;
      description: string;
      categoryId: number | null;
      amount: number;
      currency: string;
      type: string;
    },
  ) {
    await transactionsApi.transactionsUpdate(id, input);
    await this.loadFromApi();
  }

  async deleteTransaction(id: number | string) {
    await transactionsApi.transactionsDelete(id);
    await this.loadFromApi();
  }
}
