/**
 * Typed error hierarchy — agents can distinguish auth, rate limit, validation errors by exit code.
 */

export const EXIT_CODES = {
	SUCCESS: 0,
	GENERIC: 1,
	VALIDATION: 2,
	AUTH: 3,
	NOT_FOUND: 4,
	RATE_LIMIT: 5,
	PERMISSION: 6,
} as const;

export class SlackCliError extends Error {
	public readonly exitCode: number;
	public readonly code: string;
	public readonly suggestion?: string;

	constructor(message: string, opts: { exitCode?: number; code?: string; suggestion?: string } = {}) {
		super(message);
		this.name = "SlackCliError";
		this.exitCode = opts.exitCode ?? EXIT_CODES.GENERIC;
		this.code = opts.code ?? "ERROR";
		this.suggestion = opts.suggestion;
	}
}

export class AuthError extends SlackCliError {
	constructor(message: string, suggestion?: string) {
		super(message, { exitCode: EXIT_CODES.AUTH, code: "AUTH_ERROR", suggestion });
		this.name = "AuthError";
	}
}

export class RateLimitError extends SlackCliError {
	public readonly retryAfter: number;

	constructor(retryAfter: number) {
		super(`Rate limited. Retry after ${retryAfter}s.`, {
			exitCode: EXIT_CODES.RATE_LIMIT,
			code: "RATE_LIMITED",
			suggestion: `Wait ${retryAfter} seconds before retrying.`,
		});
		this.name = "RateLimitError";
		this.retryAfter = retryAfter;
	}
}

export class ValidationError extends SlackCliError {
	constructor(message: string, suggestion?: string) {
		super(message, { exitCode: EXIT_CODES.VALIDATION, code: "VALIDATION_ERROR", suggestion });
		this.name = "ValidationError";
	}
}

export class NotFoundError extends SlackCliError {
	constructor(message: string, suggestion?: string) {
		super(message, { exitCode: EXIT_CODES.NOT_FOUND, code: "NOT_FOUND", suggestion });
		this.name = "NotFoundError";
	}
}

export class PermissionError extends SlackCliError {
	constructor(message: string, suggestion?: string) {
		super(message, { exitCode: EXIT_CODES.PERMISSION, code: "PERMISSION_ERROR", suggestion });
		this.name = "PermissionError";
	}
}

// Map Slack API error strings to typed errors
const AUTH_ERRORS = new Set(["invalid_auth", "token_revoked", "token_expired", "not_authed", "account_inactive"]);
const RATE_LIMIT_ERRORS = new Set(["ratelimited"]);
const PERMISSION_ERRORS = new Set([
	"missing_scope",
	"not_allowed",
	"not_in_channel",
	"ekm_access_denied",
	"org_login_required",
]);
const NOT_FOUND_ERRORS = new Set([
	"channel_not_found",
	"user_not_found",
	"message_not_found",
	"file_not_found",
	"not_found",
]);

export function classifySlackError(err: unknown): SlackCliError {
	if (err instanceof SlackCliError) return err;

	const msg = err instanceof Error ? err.message : String(err);

	// Check for Slack API error codes in the message
	// @slack/web-api throws errors like "An API error occurred: <code>"
	const apiErrorMatch = msg.match(/An API error occurred: (\S+)/);
	const code = apiErrorMatch?.[1] ?? "";

	if (AUTH_ERRORS.has(code)) {
		return new AuthError(msg, "Check your SLACK_TOKEN / SLACK_BOT_TOKEN. It may be expired or revoked.");
	}
	if (RATE_LIMIT_ERRORS.has(code)) {
		// Try to parse retry-after from the error
		const retryMatch = msg.match(/retry after (\d+)/i);
		return new RateLimitError(retryMatch ? parseInt(retryMatch[1], 10) : 30);
	}
	if (NOT_FOUND_ERRORS.has(code)) {
		return new NotFoundError(msg, "Check that the channel/user/message ID exists and the bot has access.");
	}
	if (PERMISSION_ERRORS.has(code)) {
		return new PermissionError(msg, "The bot may lack the required OAuth scope or channel access.");
	}

	return new SlackCliError(msg);
}
