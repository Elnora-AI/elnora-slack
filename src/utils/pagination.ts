/**
 * Cursor-based pagination for Slack API responses.
 *
 * Slack uses response_metadata.next_cursor for pagination.
 * Includes stuck-cursor detection and page safety limits.
 */

import type { WebClient } from "@slack/web-api";
import { acquireToken } from "./rate-limit.js";

const MAX_PAGES = 500; // Safety limit to prevent infinite loops

export interface PaginationOptions {
	/** Slack API method name (e.g. "conversations.list") */
	method: string;
	/** Base arguments for the API call (excluding cursor) */
	args: Record<string, unknown>;
	/** Maximum total items to return (0 = unlimited) */
	limit?: number;
	/** Per-page limit to send to the API */
	pageSize?: number;
}

export interface PaginatedResult {
	/** All collected items across pages */
	items: Record<string, unknown>[];
	/** Total number of pages fetched */
	pagesFetched: number;
	/** The key in the response that held the data array */
	dataKey: string;
}

/**
 * Find the primary data array in a Slack API response.
 * Slack responses have a top-level array key (e.g. "channels", "members", "messages").
 */
function findDataKey(response: Record<string, unknown>): string | null {
	// Common Slack response array keys, in priority order
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
		if (Array.isArray(response[key])) return key;
	}

	// Fall back to first array property
	for (const [key, value] of Object.entries(response)) {
		if (key === "ok" || key === "response_metadata") continue;
		if (Array.isArray(value)) return key;
	}

	return null;
}

function getNextCursor(response: Record<string, unknown>): string | undefined {
	const meta = response.response_metadata as Record<string, unknown> | undefined;
	const cursor = meta?.next_cursor;
	if (typeof cursor === "string" && cursor.length > 0) return cursor;
	return undefined;
}

/**
 * Fetch all pages of a paginated Slack API response.
 */
export async function fetchAllPages(client: WebClient, options: PaginationOptions): Promise<PaginatedResult> {
	const { method, args, limit = 0, pageSize } = options;
	const allItems: Record<string, unknown>[] = [];
	let cursor: string | undefined;
	let pagesFetched = 0;
	let lastCursor: string | undefined;
	let dataKey: string | null = null;

	do {
		await acquireToken();

		const callArgs: Record<string, unknown> = { ...args };
		if (pageSize) callArgs.limit = pageSize;
		if (cursor) callArgs.cursor = cursor;

		const result = (await client.apiCall(method, callArgs)) as unknown as Record<string, unknown>;
		pagesFetched++;

		// Detect data key on first page
		if (!dataKey) {
			dataKey = findDataKey(result);
			if (!dataKey) break; // No array data found
		}

		const pageItems = (result[dataKey] as Record<string, unknown>[]) ?? [];
		allItems.push(...pageItems);

		// Check if we've hit the user's limit
		if (limit > 0 && allItems.length >= limit) {
			allItems.length = limit; // Trim to exact limit
			break;
		}

		cursor = getNextCursor(result);

		// Stuck cursor detection
		if (cursor && cursor === lastCursor) {
			process.stderr.write(`Warning: Stuck cursor detected on page ${pagesFetched}. Stopping pagination.\n`);
			break;
		}
		lastCursor = cursor;

		// Safety limit
		if (pagesFetched >= MAX_PAGES) {
			process.stderr.write(`Warning: Reached maximum page limit (${MAX_PAGES}). Results may be incomplete.\n`);
			break;
		}
	} while (cursor);

	return { items: allItems, pagesFetched, dataKey: dataKey ?? "items" };
}
