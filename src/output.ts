/**
 * Output contract for the Elnora Slack CLI.
 * - Success: JSON/table/CSV to stdout, exit 0
 * - Error: JSON to stderr, exit non-zero (typed exit codes)
 */

import { classifySlackError, EXIT_CODES, SlackCliError, ValidationError } from "./errors.js";
import { redactSecrets, redactSensitiveKeys } from "./security.js";
import { acquireToken } from "./utils/rate-limit.js";

// --- Global output settings ---

let compact = false;
let outputFormat: "json" | "table" | "csv" = "json";
let selectedFields: string[] | null = null;

export function setCompactMode(enabled: boolean): void {
	compact = enabled;
}

export function setOutputFormat(format: string): void {
	const valid = ["json", "table", "csv"];
	if (!valid.includes(format)) {
		throw new ValidationError(`Invalid --output value: "${format}". Must be one of: ${valid.join(", ")}.`);
	}
	outputFormat = format as "json" | "table" | "csv";
}

export function setFields(fields: string): void {
	const parsed = fields
		.split(",")
		.map((f) => f.trim())
		.filter(Boolean);
	if (parsed.length === 0) {
		throw new ValidationError(`Invalid --fields value: "${fields}". Provide comma-separated field names.`);
	}
	selectedFields = parsed;
}

// --- Data array detection ---

function findDataArray(data: unknown): { key: string; rows: Record<string, unknown>[] } | null {
	if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
	const obj = data as Record<string, unknown>;

	// Known Slack response array keys in priority order
	const knownKeys = [
		"channels",
		"members",
		"messages",
		"users",
		"files",
		"items",
		"pins",
		"reactions",
		"reminders",
		"groups",
		"ims",
		"scheduled_messages",
		"resources",
		"scopes",
		"usergroups",
		"teams",
		"logs",
	];

	for (const key of knownKeys) {
		if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0) {
			const first = (obj[key] as unknown[])[0];
			if (typeof first === "object" && first !== null) {
				return { key, rows: obj[key] as Record<string, unknown>[] };
			}
		}
	}

	// Fall back to first non-meta array property
	for (const [key, value] of Object.entries(obj)) {
		if (key === "ok" || key === "response_metadata") continue;
		if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
			return { key, rows: value as Record<string, unknown>[] };
		}
	}

	return null;
}

// --- Field filtering ---

function applyFieldFilter(data: unknown): unknown {
	if (!selectedFields) return data;

	const found = findDataArray(data);
	if (!found) {
		// Try filtering top-level object directly
		if (typeof data === "object" && data !== null && !Array.isArray(data)) {
			const obj = data as Record<string, unknown>;
			const filtered: Record<string, unknown> = {};
			for (const key of selectedFields) {
				if (key in obj) filtered[key] = obj[key];
			}
			return filtered;
		}
		return data;
	}

	// Warn about missing fields
	if (found.rows.length > 0) {
		const available = Object.keys(found.rows[0]);
		const missing = selectedFields.filter((f) => !(f in found.rows[0]));
		if (missing.length > 0) {
			process.stderr.write(
				`Warning: --fields requested non-existent field(s): ${missing.join(", ")}. ` +
					`Available: ${available.join(", ")}\n`,
			);
		}
	}

	const filteredRows = found.rows.map((row) => {
		const filtered: Record<string, unknown> = {};
		for (const field of selectedFields!) {
			if (field in row) filtered[field] = row[field];
		}
		return filtered;
	});

	const obj = { ...(data as Record<string, unknown>) };
	obj[found.key] = filteredRows;
	return obj;
}

// --- Table output ---

function formatCell(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function outputTable(data: unknown): void {
	const found = findDataArray(data);
	if (!found) {
		process.stderr.write(`Warning: --output table requested but response is not a list. Falling back to JSON.\n`);
		console.log(JSON.stringify(data, null, 2));
		return;
	}

	const { rows } = found;
	if (rows.length === 0) {
		console.log("(empty)");
		return;
	}
	const keys = Object.keys(rows[0]);
	const cells = rows.map((row) => keys.map((k) => formatCell(row[k])));

	const MAX_COL_WIDTH = 60;
	const widths = keys.map((k, i) => Math.min(MAX_COL_WIDTH, Math.max(k.length, ...cells.map((row) => row[i].length))));

	function truncateCell(value: string, maxWidth: number): string {
		return value.length > maxWidth ? value.slice(0, maxWidth - 3) + "..." : value;
	}

	const header = keys.map((k, i) => k.toUpperCase().padEnd(widths[i])).join("  ");
	const separator = widths.map((w) => "-".repeat(w)).join("  ");
	console.log(header);
	console.log(separator);

	for (const row of cells) {
		console.log(row.map((c, i) => truncateCell(c, widths[i]).padEnd(widths[i])).join("  "));
	}

	// Print non-array metadata below the table
	const obj = data as Record<string, unknown>;
	const meta: string[] = [];
	for (const [k, v] of Object.entries(obj)) {
		if (k !== found.key && k !== "ok" && k !== "response_metadata" && typeof v !== "object") {
			meta.push(`${k}: ${v}`);
		}
	}
	if (meta.length > 0) {
		console.log(`\n${meta.join(" | ")}`);
	}
}

// --- CSV output (RFC 4180) ---

function csvEscape(value: string): string {
	if (value.includes(",") || value.includes('"') || value.includes("\n")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function outputCsv(data: unknown): void {
	const found = findDataArray(data);
	if (!found) {
		process.stderr.write(`Warning: --output csv requested but response is not a list. Falling back to JSON.\n`);
		console.log(JSON.stringify(data, null, 2));
		return;
	}

	const { rows } = found;
	if (rows.length === 0) return;
	// Union of all keys across all rows for stable columns
	const keySet = new Set<string>();
	for (const row of rows) {
		for (const key of Object.keys(row)) keySet.add(key);
	}
	const keys = [...keySet];

	console.log(keys.map((k) => csvEscape(k)).join(","));
	for (const row of rows) {
		console.log(keys.map((k) => csvEscape(formatCell(row[k]))).join(","));
	}
}

// --- Public output functions ---

export function output(data: unknown): void {
	const sanitized = redactSensitiveKeys(data);
	const filtered = applyFieldFilter(sanitized);

	switch (outputFormat) {
		case "table":
			outputTable(filtered);
			break;
		case "csv":
			outputCsv(filtered);
			break;
		default:
			console.log(compact ? JSON.stringify(filtered) : JSON.stringify(filtered, null, 2));
	}
}

export function outputError(error: unknown): void {
	// Classify raw errors into typed SlackCliErrors
	const classified = classifySlackError(error);
	let msg = redactSecrets(classified.message);

	// Truncate to 500 chars to avoid leaking large payloads
	if (msg.length > 500) {
		msg = msg.slice(0, 500) + "... [truncated]";
	}

	const payload: Record<string, unknown> = {
		error: msg,
		code: classified.code,
		exitCode: classified.exitCode,
	};
	if (classified.suggestion) {
		payload.suggestion = classified.suggestion;
	}
	if (process.env.SLACK_CLI_DEBUG) {
		const stack = error instanceof Error ? error.stack : undefined;
		if (stack) payload.stack = redactSecrets(stack);
	}

	console.error(JSON.stringify(payload, null, compact ? 0 : 2));
}

// --- Command wrapper (wires error classification + rate limiting) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleAsyncCommand<T extends (...args: any[]) => Promise<void>>(fn: T): T {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (async (...args: any[]) => {
		try {
			await acquireToken();
			await fn(...args);
		} catch (error) {
			outputError(error);
			const classified = classifySlackError(error);
			process.exit(classified.exitCode);
		}
	}) as T;
}
