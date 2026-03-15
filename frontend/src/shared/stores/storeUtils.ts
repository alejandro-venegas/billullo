import { runInAction } from "mobx";

interface LoadableStore {
  isLoading: boolean;
  error: string | null;
}

export async function withLoading<T>(
  store: LoadableStore,
  fn: () => Promise<T>,
): Promise<T | undefined> {
  store.isLoading = true;
  store.error = null;
  try {
    const result = await fn();
    runInAction(() => {
      store.isLoading = false;
    });
    return result;
  } catch (e: unknown) {
    runInAction(() => {
      store.isLoading = false;
      store.error = extractErrorMessage(e, "An unexpected error occurred");
    });
    return undefined;
  }
}

export function extractErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    if ("error" in obj && obj.error && typeof obj.error === "object") {
      return extractErrorMessage(obj.error, fallback);
    }
    if ("detail" in obj && typeof obj.detail === "string") return obj.detail;
    if ("title" in obj && typeof obj.title === "string") return obj.title;
    if ("message" in obj && typeof obj.message === "string") return obj.message;
  }
  return fallback;
}
