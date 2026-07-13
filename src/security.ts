/**
 * Security utilities — token redaction, input validation, credential sanitization.
 */

import { AuthError, ValidationError } from "./errors.js";

// Token redaction: Slack tokens, Bearer tokens, generic long secrets
export function redactSecrets(text: string): string {
	return text
		.replace(/xox[bpars]-[a-zA-Z0-9-]+/g, "[REDACTED]")
		.replace(/Bearer\s+[a-zA-Z0-9._-]{20,}/gi, "Bearer [REDACTED]");
}

// Recursively redact sensitive keys in API response data
const SENSITIVE_KEYS =
	/(?:password|secret|api_key|apikey|access_key|private_key|session_id|refresh_token|access_token|bearer|authorization|token|signing_secret)/i;

export function redactSensitiveKeys(data: unknown): unknown {
	if (Array.isArray(data)) {
		return data.map(redactSensitiveKeys);
	}
	if (data !== null && typeof data === "object") {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
			if (SENSITIVE_KEYS.test(key) && typeof value === "string") {
				result[key] = "[REDACTED]";
			} else {
				result[key] = redactSensitiveKeys(value);
			}
		}
		return result;
	}
	return data;
}

// Validate Slack credential format — printable ASCII, expected prefix
export function validateToken(token: string): string {
	if (typeof token !== "string" || token.length === 0) {
		throw new AuthError("Invalid credential: must be a non-empty string");
	}
	if (!/^[\x20-\x7e]+$/.test(token)) {
		throw new AuthError("Credential contains invalid characters (non-printable bytes detected)");
	}
	if (!/^xox[bpars]-/.test(token)) {
		throw new AuthError(
			"Invalid Slack token format. Expected xoxb-, xoxp-, xoxa-, xoxr-, or xoxs- prefix.",
			"Check your SLACK_TOKEN value.",
		);
	}
	// Taint barrier — re-encode to strip any hidden unicode
	return new TextDecoder().decode(new TextEncoder().encode(token));
}

// Validate Slack channel ID format
export function validateChannelId(id: string): void {
	if (!/^[CDGW][A-Z0-9]{8,11}$/.test(id)) {
		throw new ValidationError(
			`Invalid channel ID format: "${id}". Expected C/D/G/W followed by 8-11 alphanumeric characters.`,
			"Use `elnora-slack conversations list` to find valid channel IDs.",
		);
	}
}

// Validate Slack user ID format
export function validateUserId(id: string): void {
	if (!/^[UW][A-Z0-9]{8,11}$/.test(id)) {
		throw new ValidationError(
			`Invalid user ID format: "${id}". Expected U/W followed by 8-11 alphanumeric characters.`,
			"Use `elnora-slack users list` to find valid user IDs.",
		);
	}
}

// Validate Slack message timestamp format
export function validateTimestamp(ts: string): void {
	if (!/^\d{10}\.\d{6}$/.test(ts)) {
		throw new ValidationError(
			`Invalid message timestamp format: "${ts}". Expected format: 1234567890.123456`,
			"Use `elnora-slack conversations history --channel <ID>` to find valid timestamps.",
		);
	}
}

// Validate and coerce a numeric string parameter
export function parseNumericParam(value: string, name: string, min = 1, max = 1000): number {
	const num = parseInt(value, 10);
	if (isNaN(num)) {
		throw new ValidationError(`Invalid ${name}: "${value}". Must be an integer.`);
	}
	if (num < min || num > max) {
		throw new ValidationError(`Invalid ${name}: ${num}. Must be between ${min} and ${max}.`);
	}
	return num;
}
