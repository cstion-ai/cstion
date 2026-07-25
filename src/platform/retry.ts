export type ErrorClassification = "transient" | "permanent" | "rate_limited" | "timeout";

export class ClassifiedError extends Error {
  constructor(message: string, readonly classification: ErrorClassification) {
    super(message);
  }
}

export type RetryPolicy = {
  maxAttempts: number;
  timeoutMs: number;
  shouldRetry(error: ClassifiedError, attempt: number): boolean;
};

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  timeoutMs: 2_000,
  shouldRetry(error, attempt) {
    return attempt < this.maxAttempts && ["transient", "rate_limited", "timeout"].includes(error.classification);
  }
};

export async function runWithRetry<T>(operation: () => Promise<T>, policy: RetryPolicy = defaultRetryPolicy): Promise<T> {
  let attempt = 0;
  let lastError: ClassifiedError | undefined;

  while (attempt < policy.maxAttempts) {
    attempt += 1;
    try {
      return await withTimeout(operation(), policy.timeoutMs);
    } catch (error: unknown) {
      if (error instanceof ClassifiedError) {
        lastError = error;
      } else if (error instanceof Error) {
        lastError = new ClassifiedError(error.message, "permanent");
      } else {
        lastError = new ClassifiedError("Unknown error", "permanent");
      }

      if (!policy.shouldRetry(lastError, attempt)) throw lastError;
    }
  }

  throw lastError ?? new ClassifiedError("Retry attempts exhausted", "permanent");
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new ClassifiedError(`Operation timed out after ${timeoutMs}ms`, "timeout")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
