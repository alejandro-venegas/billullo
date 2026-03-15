import { TransactionStore } from "@/features/transactions/stores/TransactionStore";
import { CategoryStore } from "@/features/categories/stores/CategoryStore";
import { RuleStore } from "@/features/categories/stores/RuleStore";
import { AuthStore } from "@/features/auth/stores/AuthStore";
import { EmailConfigStore } from "@/features/email/stores/EmailConfigStore";
import { EmailParsingRuleStore } from "@/features/email/stores/EmailParsingRuleStore";

export class RootStore {
  authStore: AuthStore;
  transactionStore: TransactionStore;
  categoryStore: CategoryStore;
  ruleStore: RuleStore;
  emailConfigStore: EmailConfigStore;
  emailParsingRuleStore: EmailParsingRuleStore;

  constructor() {
    this.authStore = new AuthStore();
    this.transactionStore = new TransactionStore();
    this.categoryStore = new CategoryStore(this);
    this.ruleStore = new RuleStore();
    this.emailConfigStore = new EmailConfigStore();
    this.emailParsingRuleStore = new EmailParsingRuleStore();

    // Wire up: after auth succeeds, load all data from API
    this.authStore.setOnAuthenticated(() => this.loadAll());
  }

  async loadAll() {
    await Promise.all([
      this.transactionStore.loadFromApi(),
      this.categoryStore.loadFromApi(),
      this.ruleStore.loadFromApi(),
      this.emailConfigStore.loadFromApi(),
      this.emailParsingRuleStore.loadFromApi(),
    ]);
  }

  dispose() {
    // no-op; stores no longer use localStorage reactions
  }
}
