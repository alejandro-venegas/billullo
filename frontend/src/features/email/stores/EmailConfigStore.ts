import { makeAutoObservable, runInAction } from "mobx";
import { emailConfigApi } from "@/api/apiConfig";
import type { EmailConfigDto, TestConnectionResult } from "@/api/data-contracts";
import { withLoading } from "@/shared/stores/storeUtils";
import { signalRService } from "@/shared/signalRService";

export interface ScrapeProgress {
  processed: number;
  total: number;
  created: number;
}

export class EmailConfigStore {
  config: EmailConfigDto | null = null;
  isLoading = false;
  error: string | null = null;

  isScraping = false;
  scrapeProgress: ScrapeProgress | null = null;
  scrapeDone: { processed: number; created: number } | null = null;
  scrapeError: string | null = null;

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

  async scrape() {
    runInAction(() => {
      this.isScraping = true;
      this.scrapeProgress = null;
      this.scrapeDone = null;
      this.scrapeError = null;
    });

    const onProgress = (data: ScrapeProgress) =>
      runInAction(() => { this.scrapeProgress = data; });

    const onDone = (data: { processed: number; created: number }) =>
      runInAction(() => {
        this.isScraping = false;
        this.scrapeProgress = null;
        this.scrapeDone = data;
      });

    const onError = (data: { message: string }) =>
      runInAction(() => {
        this.isScraping = false;
        this.scrapeError = data.message;
      });

    signalRService.on("ScrapeProgress", onProgress as (...args: unknown[]) => void);
    signalRService.on("ScrapeDone", onDone as (...args: unknown[]) => void);
    signalRService.on("ScrapeError", onError as (...args: unknown[]) => void);

    try {
      await emailConfigApi.emailConfigScrape();
    } catch (e) {
      runInAction(() => {
        this.isScraping = false;
        this.scrapeError = e instanceof Error ? e.message : "Scrape failed";
      });
    } finally {
      signalRService.off("ScrapeProgress", onProgress as (...args: unknown[]) => void);
      signalRService.off("ScrapeDone", onDone as (...args: unknown[]) => void);
      signalRService.off("ScrapeError", onError as (...args: unknown[]) => void);
    }
  }

  dismissScrapeResult() {
    runInAction(() => {
      this.scrapeDone = null;
      this.scrapeError = null;
    });
  }
}
