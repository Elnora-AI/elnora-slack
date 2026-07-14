/**
 * Retry wrapper for outbound API calls (Linear SDK, fetch, etc).
 *
 * Defaults to 3 attempts with exponential backoff and jitter, retrying only
 * on transient failures: 429, 5xx, and network errors. 4xx (other than 429)
 * is treated as fatal — retrying a 400 / 401 / 404 just wastes quota.
 *
 * Usage:
 *   const result = await withRetry(() => client.updateIssue(id, updates));
 */

import pRetry, { AbortError, type Options } from "p-retry";

interface MaybeHttpError {
	statusCode?: number;
	status?: number;
	response?: { status?: number };
}

function isTransient(err: unknown): boolean {
	if (!err || typeof err !== "object") return true; // unknown shape — retry once
	const e = err as MaybeHttpError;
	const status = e.statusCode ?? e.status ?? e.response?.status;
	if (status === undefined) return true; // network / SDK error with no status — retry
	if (status === 429) return true;
	if (status >= 500 && status < 600) return true;
	return false;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: Options = {}): Promise<T> {
	return pRetry(
		async () => {
			try {
				return await fn();
			} catch (err) {
				if (!isTransient(err)) {
					// p-retry treats AbortError as a non-retryable signal.
					throw new AbortError(err instanceof Error ? err : new Error(String(err)));
				}
				throw err;
			}
		},
		{
			retries: 3,
			minTimeout: 500,
			maxTimeout: 5_000,
			randomize: true,
			...opts,
		},
	);
}
