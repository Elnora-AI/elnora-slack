/**
 * Token-bucket rate limiter for Slack API (Tier 2: ~50 req/min default).
 * Prevents 429 storms by throttling requests client-side.
 */

const MAX_TOKENS = 50;
const REFILL_INTERVAL_MS = 60_000; // 1 minute

let tokens = MAX_TOKENS;
let lastRefill = Date.now();

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function refill(): void {
	const now = Date.now();
	const elapsed = now - lastRefill;
	const refillAmount = Math.floor((elapsed / REFILL_INTERVAL_MS) * MAX_TOKENS);
	if (refillAmount > 0) {
		tokens = Math.min(MAX_TOKENS, tokens + refillAmount);
		// Advance by consumed time only — preserve fractional remainder
		lastRefill += (refillAmount / MAX_TOKENS) * REFILL_INTERVAL_MS;
	}
}

export async function acquireToken(): Promise<void> {
	refill();
	if (tokens > 0) {
		tokens--;
		return;
	}
	// Wait for next refill
	const waitMs = REFILL_INTERVAL_MS - (Date.now() - lastRefill);
	process.stderr.write(`Rate limit: waiting ${Math.ceil(waitMs / 1000)}s...\n`);
	await sleep(Math.max(waitMs, 0));
	refill();
	if (tokens <= 0) {
		tokens = 1; // Guarantee at least 1 token after a full wait cycle
	}
	tokens--;
}

const MAX_RETRY_SECONDS = 300; // Cap retry delay at 5 minutes

export function getRetryAfterMs(retryAfterHeader: string | null): number | null {
	if (!retryAfterHeader) return null;

	// Try parsing as seconds (most common for Slack)
	const seconds = Number.parseInt(retryAfterHeader, 10);
	if (!Number.isNaN(seconds)) {
		return Math.min(seconds, MAX_RETRY_SECONDS) * 1000;
	}

	// Try parsing as HTTP-date (RFC 7231)
	const date = new Date(retryAfterHeader);
	if (!Number.isNaN(date.getTime())) {
		const delayMs = Math.max(0, date.getTime() - Date.now());
		return Math.min(delayMs, MAX_RETRY_SECONDS * 1000);
	}

	return null;
}
