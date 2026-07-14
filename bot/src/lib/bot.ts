/**
 * Chat SDK bot wiring — Slack adapter, state, authorization, and the shared
 * message handler. Everything is configured from the environment:
 *
 *   SLACK_BOT_TOKEN / SLACK_SIGNING_SECRET — required for the Slack adapter
 *   REDIS_URL — conversation memory across serverless invocations (recommended;
 *               falls back to in-memory state, which only survives warm starts)
 *   BOT_STATE_PREFIX — Redis key prefix (default "slack-agent-bot")
 *   ALLOWED_SLACK_USER_IDS — CSV of Slack user IDs. Unset or "*" means every
 *               human in the workspace may use the bot (the Slack signing
 *               secret already guarantees events only come from YOUR app in
 *               YOUR workspace). Set a CSV to restrict to specific people.
 */

import { createSlackAdapter } from "@chat-adapter/slack";
import { createMemoryState } from "@chat-adapter/state-memory";
import { createRedisState } from "@chat-adapter/state-redis";
import { Chat } from "chat";
import { agent } from "./agent";
import { isAuthorized, UNAUTHORIZED_MSG } from "./authorize";
import { scrubSlackBroadcasts } from "./slack-scrub";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThreadState {
	/** Conversation history for context continuity */
	history?: Array<{ role: "user" | "assistant"; content: string }>;
}

// ---------------------------------------------------------------------------
// Adapters + state
// ---------------------------------------------------------------------------

const adapters: Record<string, ReturnType<typeof createSlackAdapter>> = {};

if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET) {
	adapters.slack = createSlackAdapter();
}

const state = process.env.REDIS_URL
	? createRedisState({
			url: process.env.REDIS_URL,
			keyPrefix: process.env.BOT_STATE_PREFIX?.trim() || "slack-agent-bot",
		})
	: createMemoryState();

// ---------------------------------------------------------------------------
// Bot instance
// ---------------------------------------------------------------------------

export const bot = new Chat<typeof adapters, ThreadState>({
	userName: process.env.BOT_SLACK_USERNAME?.trim() || "slack-agent",
	adapters,
	state,
	logger: process.env.NODE_ENV === "development" ? "debug" : "info",
	dedupeTtlMs: 10_000,
});

// ---------------------------------------------------------------------------
// Message handler (shared by all entry points)
// ---------------------------------------------------------------------------

/** Max characters stored per message in history (matches Slack's limit) */
const MAX_MSG_LENGTH = 4000;

async function handleMessage(
	thread: Parameters<Parameters<typeof bot.onNewMention>[0]>[0],
	message: Parameters<Parameters<typeof bot.onNewMention>[0]>[1],
) {
	// Skip bot's own messages (and any other bot)
	if (message.author.isBot) return;

	if (!isAuthorized(message.author.userId)) {
		await thread.post(UNAUTHORIZED_MSG);
		return;
	}

	await thread.startTyping();

	// Load conversation history from thread state
	const threadState = await thread.state;
	const history = threadState?.history ?? [];

	const userText = (message.text ?? "").slice(0, MAX_MSG_LENGTH);

	// Build messages for the agent — filter out any empty content entries
	// that could have been stored from previous failed API calls.
	const messages = [
		...history
			.filter((m) => m.content)
			.map((m) => ({
				role: m.role as "user" | "assistant",
				content: m.content,
			})),
		{ role: "user" as const, content: userText },
	];

	try {
		// Generate the full response, then post it. Streaming via thread.post
		// requires the Slack AI Assistant scopes (assistant:write) — plain
		// agent.generate + thread.post(string) works with regular chat:write.
		const result = await agent.generate({ messages });
		// Scrub broadcast tokens — an org-wide bot must never mass-ping, even if
		// the model is prompted into emitting <!channel>/<!here>/<!everyone>.
		const assistantText = scrubSlackBroadcasts(await result.text).slice(0, MAX_MSG_LENGTH);

		if (assistantText) {
			try {
				await thread.post(assistantText);
			} catch (postErr) {
				console.error("Failed to post agent response to Slack:", postErr);
			}
		} else {
			// Tool-only step (no final text) — let the user know rather than going silent.
			try {
				await thread.post("(done — no message)");
			} catch (postErr) {
				console.error("Failed to post empty-result placeholder to Slack:", postErr);
			}
		}

		// Persist conversation — keep last 20 messages (slice to 18 + 2 new = 20).
		// Skip persisting if the assistant response is empty — avoids poisoning
		// history with empty content that the model API rejects on later calls.
		if (assistantText) {
			try {
				await thread.setState({
					history: [
						...history.slice(-18),
						{ role: "user", content: userText },
						{ role: "assistant", content: assistantText },
					],
				});
			} catch (stateErr) {
				console.error("Failed to persist thread state:", stateErr);
			}
		}
	} catch (err) {
		console.error("Agent error:", err);
		// Post a generic error to Slack — never leak internal error details
		try {
			await thread.post("Something went wrong processing your request. Check the deployment logs for details.");
		} catch {
			console.error("Failed to post error message to Slack");
		}
	}
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

// Someone @mentions the bot in a channel (new thread or inside an existing one)
bot.onNewMention(async (thread, message) => {
	await thread.subscribe();
	await handleMessage(thread, message);
});

// Follow-up messages in subscribed threads (channel threads the bot is part of)
bot.onSubscribedMessage(async (thread, message) => {
	await handleMessage(thread, message);
});

// DMs to the bot
bot.onDirectMessage(async (thread, message) => {
	await thread.subscribe();
	await handleMessage(thread, message);
});
