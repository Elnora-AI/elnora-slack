import { WebClient } from "@slack/web-api";
import { tool } from "ai";
import { z } from "zod";

/**
 * Slack search.* requires a USER token (xoxp-). Bot tokens (xoxb-, used by
 * SLACK_BOT_TOKEN for the chat adapter) are rejected by Slack with
 * `not_allowed_token_type`. Configure SLACK_USER_TOKEN separately via an
 * OAuth flow with the `search:read` scope.
 */
function getUserClient(): WebClient {
	const token = process.env.SLACK_USER_TOKEN;
	if (!token) {
		throw new Error(
			"SLACK_USER_TOKEN not configured — Slack search requires a user token (xoxp-) with search:read scope.",
		);
	}
	if (!token.startsWith("xoxp-")) {
		throw new Error("SLACK_USER_TOKEN must be a user token (xoxp- prefix), not a bot token.");
	}
	return new WebClient(token, { timeout: 30_000 });
}

interface SlackSearchMatch {
	type?: string;
	user?: string;
	username?: string;
	ts?: string;
	text?: string;
	permalink?: string;
	channel?: { id?: string; name?: string };
}

interface SlackSearchResponse {
	ok: boolean;
	error?: string;
	messages?: {
		total?: number;
		matches?: SlackSearchMatch[];
	};
}

export const slackSearchMessages = tool({
	description:
		"Search Slack messages across channels and DMs the authorized user has access to. Use to find a past conversation or something said in Slack. Requires a user token (xoxp-) with search:read scope.",
	inputSchema: z.object({
		query: z
			.string()
			.min(1)
			.max(500)
			.describe(
				"Slack search query. Supports operators like in:#channel, from:@user, before:YYYY-MM-DD, after:YYYY-MM-DD, has:link.",
			),
		count: z.number().int().min(1).max(50).optional().default(10).describe("Number of matches to return (max 50)."),
		sort: z
			.enum(["score", "timestamp"])
			.optional()
			.default("timestamp")
			.describe("Sort by relevance ('score') or recency ('timestamp')."),
	}),
	execute: async ({ query, count, sort }) => {
		let client: WebClient;
		try {
			client = getUserClient();
		} catch (err) {
			return { error: err instanceof Error ? err.message : String(err) };
		}

		let result: SlackSearchResponse;
		try {
			// @slack/web-api returns a typed response; cast through unknown to keep
			// our local shape narrow without pulling the full SDK types.
			result = (await client.search.messages({
				query,
				count,
				sort,
				sort_dir: "desc",
			})) as unknown as SlackSearchResponse;
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			// Surface Slack's not_allowed_token_type with actionable guidance
			if (msg.includes("not_allowed_token_type")) {
				return {
					error:
						"Slack rejected the token: search.messages requires a user token (xoxp-). Re-issue OAuth with search:read scope.",
				};
			}
			return { error: `Slack search failed: ${msg}` };
		}

		if (!result.ok) {
			return { error: `Slack search failed: ${result.error ?? "unknown"}` };
		}

		const matches = result.messages?.matches ?? [];
		return {
			total: result.messages?.total ?? 0,
			matches: matches.map((m) => ({
				channel: m.channel?.name ? `#${m.channel.name}` : (m.channel?.id ?? "unknown"),
				user: m.username ?? m.user ?? "unknown",
				ts: m.ts,
				text: m.text?.slice(0, 500),
				permalink: m.permalink,
			})),
		};
	},
});
