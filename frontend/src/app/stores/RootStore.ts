import { TransactionStore } from "@/features/transactions/stores/TransactionStore";
import { CategoryStore } from "@/features/categories/stores/CategoryStore";
import { RuleStore } from "@/features/categories/stores/RuleStore";
import { AuthStore } from "@/features/auth/stores/AuthStore";
import { EmailConfigStore } from "@/features/email/stores/EmailConfigStore";
import { EmailParsingRuleStore } from "@/features/email/stores/EmailParsingRuleStore";
import { PreferenceStore } from "@/features/preferences/stores/PreferenceStore";
import { AccountStore } from "@/features/accounts/stores/AccountStore";
import { signalRService } from "@/shared/signalRService";
import { getAccessToken } from "@/api/apiConfig";

export class RootStore {
  authStore: AuthStore;
  transactionStore: TransactionStore;
  categoryStore: CategoryStore;
  ruleStore: RuleStore;
  emailConfigStore: EmailConfigStore;
  emailParsingRuleStore: EmailParsingRuleStore;
  preferenceStore: PreferenceStore;
  accountStore: AccountStore;

  constructor() {
    this.authStore = new AuthStore();
    this.transactionStore = new TransactionStore();
    this.categoryStore = new CategoryStore(this);
    this.ruleStore = new RuleStore();
    this.emailConfigStore = new EmailConfigStore();
    this.emailParsingRuleStore = new EmailParsingRuleStore();
    this.preferenceStore = new PreferenceStore();
    this.accountStore = new AccountStore();

    this.authStore.setOnAuthenticated(() => {
      signalRService.connect(getAccessToken);
      signalRService.on("TransactionCreated", () =>
        this.transactionStore.loadFromApi(),
      );
      this.loadAll();
    });
    this.authStore.setOnLogout(() => signalRService.disconnect());
  }

  async loadAll() {
    await Promise.all([
      this.preferenceStore.loadFromApi(),
      this.transactionStore.loadFromApi(),
      this.categoryStore.loadFromApi(),
      this.ruleStore.loadFromApi(),
      this.emailConfigStore.loadFromApi(),
      this.emailParsingRuleStore.loadFromApi(),
      this.accountStore.loadFromApi(),
    ]);
  }

  dispose() {
    // no-op
  }
}
