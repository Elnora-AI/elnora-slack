/**
 * Slack WebClient singleton — wraps @slack/web-api with env-based auth.
 *
 * Token resolution order (default):
 *   1. SLACK_TOKEN / SLACK_BOT_TOKEN / SLACK_USER_TOKEN from the environment
 *   2. ~/.config/elnora-slack/.env    (or $SLACK_CONFIG_DIR/.env)
 *   3. .env next to the installed CLI  (repo-local dev convenience)
 *
 * The env files are parsed with a strict 3-key allowlist; nothing outside the
 * config directory or the CLI's own folder is ever read. No credentials leave
 * the machine except to Slack's own API hosts.
 *
 * For methods that require a user token (e.g. search.messages, search.files,
 * search.all), pass `{ requireUserToken: true }` to `getClient()`. This forces
 * resolution to SLACK_USER_TOKEN and rejects bot tokens with a clear error.
 *
 * Security: SSRF guard, request timeout, auth validation.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LogLevel, WebClient } from "@slack/web-api";
import { AuthError } from "./errors.js";
import { validateToken } from "./security.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// SSRF guard — only allow requests to Slack's API hosts
const ALLOWED_HOSTS = new Set(["slack.com", "api.slack.com", "www.slack.com", "files.slack.com"]);

export function validateSlackHost(url: string): void {
	try {
		const parsed = new URL(url);
		if (!ALLOWED_HOSTS.has(parsed.hostname) && !parsed.hostname.endsWith(".slack.com")) {
			throw new Error(`SSRF blocked: ${parsed.hostname} is not an allowed Slack API host`);
		}
		if (parsed.protocol !== "https:") {
			throw new Error(`Insecure protocol: ${parsed.protocol} — only HTTPS is allowed`);
		}
	} catch (err) {
		if (err instanceof TypeError) {
			throw new Error(`Invalid URL: ${url}`);
		}
		throw err;
	}
}

// Env allowlist — only these variables are extracted from .env files
const ALLOWED_ENV_KEYS = new Set(["SLACK_TOKEN", "SLACK_BOT_TOKEN", "SLACK_USER_TOKEN"]);

function parseEnvFile(filePath: string): void {
	if (!existsSync(filePath)) return;
	const content = readFileSync(filePath, "utf-8");
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIndex = trimmed.indexOf("=");
		if (eqIndex === -1) continue;
		const key = trimmed.slice(0, eqIndex).trim();
		if (!ALLOWED_ENV_KEYS.has(key)) continue;
		let value = trimmed.slice(eqIndex + 1).trim();
		// Strip surrounding quotes
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		// Only set if not already in environment (env vars take precedence, even empty)
		if (!(key in process.env) || process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

// User config dir: $SLACK_CONFIG_DIR overrides, else ~/.config/elnora-slack.
function configDir(): string {
	const override = process.env.SLACK_CONFIG_DIR?.trim();
	if (override) return override;
	return join(homedir(), ".config", "elnora-slack");
}

function loadEnv(): void {
	// Environment always wins (parseEnvFile never overwrites an existing key), so
	// the file layers below only fill in what the environment did not provide.
	//   1. ~/.config/elnora-slack/.env — the standard per-user credential store.
	parseEnvFile(join(configDir(), ".env"));

	//   2. .env next to the installed CLI — convenience for repo-local dev.
	parseEnvFile(resolve(__dirname, "..", ".env"));
}

let defaultClient: WebClient | null = null;
let userClient: WebClient | null = null;

// Request timeout: 30 seconds
const REQUEST_TIMEOUT_MS = 30_000;

export interface GetClientOptions {
	/**
	 * When true, resolve to SLACK_USER_TOKEN (xoxp-) only. Required for
	 * search.* methods and other endpoints that reject bot tokens.
	 */
	requireUserToken?: boolean;
}

export function getClient(opts: GetClientOptions = {}): WebClient {
	loadEnv();

	if (opts.requireUserToken) {
		if (userClient) return userClient;

		const rawUserToken = process.env.SLACK_USER_TOKEN;
		if (!rawUserToken) {
			throw new AuthError(
				"This method requires a user token. Set SLACK_USER_TOKEN (xoxp-…). Bot tokens cannot call search.* methods.",
				"Run a Slack OAuth flow with the necessary user scopes (e.g. search:read) and export SLACK_USER_TOKEN.",
			);
		}

		const token = validateToken(rawUserToken);
		if (!token.startsWith("xoxp-")) {
			throw new AuthError(
				"SLACK_USER_TOKEN must be a user token (xoxp- prefix), not a bot or app token.",
				"Re-issue an OAuth flow as the authorized user and capture the xoxp- token.",
			);
		}

		userClient = new WebClient(token, {
			timeout: REQUEST_TIMEOUT_MS,
			logLevel: process.env.SLACK_CLI_DEBUG ? LogLevel.DEBUG : LogLevel.ERROR,
		});
		return userClient;
	}

	if (defaultClient) return defaultClient;

	const rawToken = process.env.SLACK_TOKEN || process.env.SLACK_BOT_TOKEN || process.env.SLACK_USER_TOKEN;

	if (!rawToken) {
		throw new AuthError(
			"No Slack token found. Set SLACK_TOKEN, SLACK_BOT_TOKEN, or SLACK_USER_TOKEN.",
			"Export one of these env vars or add it to your .env file.",
		);
	}

	const token = validateToken(rawToken);

	defaultClient = new WebClient(token, {
		timeout: REQUEST_TIMEOUT_MS,
		logLevel: process.env.SLACK_CLI_DEBUG ? LogLevel.DEBUG : LogLevel.ERROR,
	});

	return defaultClient;
}
