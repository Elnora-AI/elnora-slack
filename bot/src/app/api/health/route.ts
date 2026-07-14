/**
 * Health probe for uptime monitoring.
 *
 * URL: GET /api/health
 *
 * Response:
 *   200 — healthy
 *   503 — Redis is configured but unreachable (conversation memory down)
 *
 * Body: { status: "ok" | "degraded", checks: { [name]: { ok, detail?, latency_ms? } } }
 *
 * Auth: none. Reveals only presence/connectivity, never secrets.
 */

import { createClient } from "redis";

interface CheckResult {
	ok: boolean;
	detail?: string;
	latency_ms?: number;
}

const REDIS_PING_TIMEOUT_MS = 3000;

async function pingRedis(): Promise<CheckResult> {
	const url = process.env.REDIS_URL;
	if (!url) return { ok: true, detail: "not configured — using in-memory state" };

	const start = Date.now();
	// Short-lived dedicated client so a degraded shared client doesn't mask a
	// true outage. Promise.race double-belts the connect timeout so the route
	// can never hang past 3s.
	const client = createClient({
		url,
		socket: { connectTimeout: REDIS_PING_TIMEOUT_MS, reconnectStrategy: false },
	});
	client.on("error", () => {
		/* swallow — pingRedis returns the failure via try/catch */
	});
	try {
		await Promise.race([
			client.connect(),
			new Promise((_, reject) => setTimeout(() => reject(new Error("connect timeout")), REDIS_PING_TIMEOUT_MS)),
		]);
		const pong = await Promise.race([
			client.ping(),
			new Promise((_, reject) => setTimeout(() => reject(new Error("ping timeout")), REDIS_PING_TIMEOUT_MS)),
		]);
		if (pong !== "PONG") {
			return { ok: false, detail: `unexpected ping reply: ${pong}` };
		}
		return { ok: true, latency_ms: Date.now() - start };
	} catch (err) {
		return {
			ok: false,
			detail: err instanceof Error ? err.message : "ping failed",
			latency_ms: Date.now() - start,
		};
	} finally {
		try {
			await client.close();
		} catch {
			/* swallow */
		}
	}
}

function envPresent(name: string, detail?: string): CheckResult {
	return process.env[name] ? { ok: true } : { ok: false, detail: detail ?? `${name} not set` };
}

export async function GET() {
	const redis = await pingRedis();

	const checks: Record<string, CheckResult> = {
		redis,
		anthropic: envPresent("ANTHROPIC_API_KEY"),
		slack_bot: envPresent("SLACK_BOT_TOKEN"),
		slack_signing: envPresent("SLACK_SIGNING_SECRET"),
	};

	// Optional tool envs — presence only, absence is not a failure
	const optional: Record<string, string> = {
		knowledge_base: "DRIVE_ID",
		linear: "LINEAR_API_KEY",
		google_oauth: "GOOGLE_REFRESH_TOKEN",
		slack_search: "SLACK_USER_TOKEN",
		web_search: "TAVILY_API_KEY",
	};
	for (const [name, env] of Object.entries(optional)) {
		checks[name] = process.env[env] ? { ok: true } : { ok: true, detail: "not configured" };
	}

	// Redis is the only runtime dependency probed — degraded only if it is
	// configured AND unreachable.
	const degraded = !redis.ok;

	return Response.json({ status: degraded ? "degraded" : "ok", checks }, { status: degraded ? 503 : 200 });
}
