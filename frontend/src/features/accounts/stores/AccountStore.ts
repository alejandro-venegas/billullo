import { makeAutoObservable } from "mobx";
import { accountsApi } from "@/api/apiConfig";
import type {
  AccountDto,
  CreateAccountRequest,
  UpdateAccountRequest,
  DeleteAccountRequest,
  AdjustBalanceRequest,
  TransactionBalanceDto,
} from "@/api/data-contracts";
import { withLoading } from "@/shared/stores/storeUtils";

export class AccountStore {
  accounts: AccountDto[] = [];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get defaultAccount(): AccountDto | undefined {
    return this.accounts.find((a) => a.isDefault === true);
  }

  get nonDefaultAccounts(): AccountDto[] {
    return this.accounts.filter((a) => !a.isDefault);
  }

  async loadFromApi() {
    await withLoading(this, async () => {
      const data = await accountsApi.accountsGetAll();
      this.accounts = data ?? [];
    });
  }

  async addAccount(input: CreateAccountRequest) {
    await accountsApi.accountsCreate(input);
    await this.loadFromApi();
  }

  async updateAccount(id: number, input: UpdateAccountRequest) {
    await accountsApi.accountsUpdate(id, input);
    await this.loadFromApi();
  }

  async deleteAccount(id: number, options: DeleteAccountRequest) {
    await accountsApi.accountsDelete(id, options);
    await this.loadFromApi();
  }

  async adjustBalance(accountId: number, request: AdjustBalanceRequest) {
    await accountsApi.accountsAdjustBalance(accountId, request);
  }

  async getAccountBalance(
    accountId: number,
    targetCurrency: string,
  ): Promise<TransactionBalanceDto> {
    const result = await accountsApi.accountsGetBalance(accountId, {
      targetCurrency,
    });
    return result;
  }
}
