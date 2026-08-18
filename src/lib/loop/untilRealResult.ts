export type UntilRealResultOptions<T> = {
  /** Attempts per runner. Default 4. */
  attempts?: number;
  delayMs?: number | ((attempt: number) => number);
  isReal: (result: T) => boolean;
  run: () => Promise<T>;
  fallbacks?: Array<() => Promise<T>>;
  sleep?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveDelay(
  delayMs: number | ((attempt: number) => number) | undefined,
  attempt: number
): number {
  if (typeof delayMs === 'function') return Math.max(0, delayMs(attempt));
  if (typeof delayMs === 'number') return Math.max(0, delayMs);
  return Math.min(4000, 300 * attempt);
}

/**
 * Retry an output-producing action until `isReal` passes, then optional fallback runners.
 * Do not use for login, payments, or destructive actions.
 */
export async function untilRealResult<T>(
  options: UntilRealResultOptions<T>
): Promise<T | undefined> {
  const attempts = Math.max(1, options.attempts ?? 4);
  const sleep = options.sleep ?? defaultSleep;
  const runners = [options.run, ...(options.fallbacks ?? [])];

  for (const runner of runners) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const result = await runner();
      if (options.isReal(result)) return result;
      if (attempt < attempts) {
        await sleep(resolveDelay(options.delayMs, attempt));
      }
    }
  }
  return undefined;
}
