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
import { WebClient } from "@slack/web-api";
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

	const userText = (message.text ?? "").slice(0, MAX_MSG_LENGTH);

	// Load conversation context LIVE from Slack. Thread state is in-memory on
	// Vercel serverless and doesn't survive across invocations, so it can't be
	// the memory. Instead we read the actual thread replies (or recent channel/
	// DM history) from Slack each time — real memory, no Redis required.
	const context = await fetchSlackContext(thread, message);
	const messages = [...context, { role: "user" as const, content: userText }];

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
		// No thread-state write needed — context is read live from Slack on each
		// message (see fetchSlackContext), so there is nothing to persist.
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
// Self-mention detection (double-reply guard)
// ---------------------------------------------------------------------------

// A channel message that @-mentions the bot is delivered by Slack as BOTH an
// `app_mention` event (→ onNewMention) AND a `message.channels` event
// (→ onSubscribedMessage). In serverless, those are separate invocations, so
// in-memory dedup can't catch them — instead onSubscribedMessage skips any
// message that mentions the bot, letting onNewMention own it. Non-mention
// follow-ups in a subscribed thread still flow through onSubscribedMessage.
let _botUserId: string | null = null;
let _botUserIdFetched = false;
async function getBotUserId(): Promise<string | null> {
	if (_botUserIdFetched) return _botUserId;
	_botUserIdFetched = true;
	const token = process.env.SLACK_BOT_TOKEN;
	if (!token) return null;
	try {
		const res = await new WebClient(token, { timeout: 5_000 }).auth.test();
		_botUserId = (res.user_id as string) ?? null;
	} catch {
		_botUserId = null;
	}
	return _botUserId;
}

async function mentionsBot(text: string | undefined): Promise<boolean> {
	const id = await getBotUserId();
	return !!id && !!text && text.includes(`<@${id}>`);
}

// ---------------------------------------------------------------------------
// Live conversation context
// ---------------------------------------------------------------------------

/** How many prior messages to pull in for context. */
const CONTEXT_LIMIT = 15;

/**
 * Read the recent conversation straight from Slack so the agent has real
 * memory without depending on persisted thread state (which doesn't survive
 * serverless cold starts). In a thread we read the thread replies; otherwise
 * we read the channel/DM's recent history. The bot's own messages become
 * `assistant` turns, everyone else's become `user` turns.
 */
async function fetchSlackContext(
	thread: Parameters<Parameters<typeof bot.onNewMention>[0]>[0],
	message: Parameters<Parameters<typeof bot.onNewMention>[0]>[1],
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
	const token = process.env.SLACK_BOT_TOKEN;
	if (!token) return [];

	const t = thread as unknown as Record<string, unknown>;
	const m = message as unknown as Record<string, unknown>;

	// Resolve the channel id from the thread (id field or the "slack:C…:ts" key).
	let channelId = (t.channel as { id?: string } | undefined)?.id;
	if (!channelId) {
		for (const v of [t.threadId, t.id]) {
			if (typeof v === "string") {
				const mt = v.match(/^slack:([^:]+)/);
				if (mt) {
					channelId = mt[1];
					break;
				}
			}
		}
	}
	if (!channelId) return [];

	const raw = (m.raw ?? {}) as { thread_ts?: string; ts?: string };
	const client = new WebClient(token, { timeout: 8_000 });

	try {
		let msgs: Array<{ user?: string; bot_id?: string; text?: string; ts?: string }> = [];
		if (raw.thread_ts) {
			const res = await client.conversations.replies({ channel: channelId, ts: raw.thread_ts, limit: CONTEXT_LIMIT });
			msgs = (res.messages ?? []) as typeof msgs;
		} else {
			const res = await client.conversations.history({ channel: channelId, limit: CONTEXT_LIMIT });
			msgs = ((res.messages ?? []) as typeof msgs).reverse();
		}

		const botId = await getBotUserId();
		return msgs
			.filter((x) => x.text && x.ts !== raw.ts)
			.map((x) => ({
				role: (botId && x.user === botId) || x.bot_id ? ("assistant" as const) : ("user" as const),
				content: (x.text as string).slice(0, MAX_MSG_LENGTH),
			}));
	} catch (err) {
		console.error("Failed to fetch Slack context:", err instanceof Error ? err.name : "unknown");
		return [];
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

// Follow-up messages in subscribed threads (channel threads the bot is part of).
// Skip messages that mention the bot — those also fire app_mention and are
// handled by onNewMention, so processing here too would double-reply.
bot.onSubscribedMessage(async (thread, message) => {
	if (message.author.isBot) return;
	if (await mentionsBot(message.text)) return;
	await handleMessage(thread, message);
});

// DMs to the bot
bot.onDirectMessage(async (thread, message) => {
	await thread.subscribe();
	await handleMessage(thread, message);
});
