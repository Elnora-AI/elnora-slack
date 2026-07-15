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
import { resolveEmojiAction } from "./emoji-actions";
import { scrubSlackBroadcasts } from "./slack-scrub";
import {
	classifyThreadMessages,
	isOurBotMessage,
	MAX_MSG_LENGTH,
	type RawSlackMessage,
	resolveChannelId,
	type SlackContext,
	selectContextWindow,
} from "./thread-context";

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

type BotThread = Parameters<Parameters<typeof bot.onNewMention>[0]>[0];
type BotMessage = Parameters<Parameters<typeof bot.onNewMention>[0]>[1];

async function handleMessage(thread: BotThread, message: BotMessage, preloaded?: SlackContext) {
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
	// DM history) from Slack each time — real memory, no Redis required. The
	// caller may pass an already-fetched context to avoid a second Slack round
	// trip (the follow-up handler fetches it to gate on bot participation).
	const context = preloaded ?? (await fetchSlackContext(thread, message));
	// Observability: one structured line per handled message so the Vercel logs
	// show whether context actually loaded (the classic silent-failure was an
	// empty context surfacing as "I don't have prior context in this thread").
	console.info("slack.handleMessage", {
		channel: context.channelId,
		contextMessages: context.messages.length,
		botParticipated: context.botParticipated,
	});
	// Attribute the current turn so the agent knows who it's acting for —
	// in group channels several people talk to the bot in the same thread.
	const sender = message.author.fullName || message.author.userName || message.author.userId;
	const messages = [
		...context.messages,
		{ role: "user" as const, content: `[from ${sender} (<@${message.author.userId}>)] ${userText}` },
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

// Cache ONLY a successful identity. Caching a failed auth.test (all-null) would
// poison the warm serverless instance: with null ids, isOurBotMessage never
// matches, botParticipated is always false, and the follow-up gate silently
// stops answering. On failure we return nulls without caching, so the next
// message retries.
let _botIdentity: { userId: string; botId: string | null } | null = null;
async function getBotIdentity(): Promise<{ userId: string | null; botId: string | null }> {
	if (_botIdentity) return _botIdentity;
	const token = process.env.SLACK_BOT_TOKEN;
	if (!token) return { userId: null, botId: null };
	try {
		const res = await new WebClient(token, { timeout: 5_000 }).auth.test();
		const userId = (res.user_id as string) ?? null;
		if (!userId) return { userId: null, botId: (res.bot_id as string) ?? null };
		_botIdentity = { userId, botId: (res.bot_id as string) ?? null };
		return _botIdentity;
	} catch {
		return { userId: null, botId: null };
	}
}

async function getBotUserId(): Promise<string | null> {
	return (await getBotIdentity()).userId;
}

async function mentionsBot(text: string | undefined): Promise<boolean> {
	const id = await getBotUserId();
	return !!id && !!text && text.includes(`<@${id}>`);
}

// ---------------------------------------------------------------------------
// Live conversation context
// ---------------------------------------------------------------------------

/** How many prior messages to hand the agent as context (env-tunable, 1–50). */
const CONTEXT_LIMIT = (() => {
	const n = Number.parseInt(process.env.BOT_CONTEXT_LIMIT ?? "", 10);
	return Number.isFinite(n) && n >= 1 && n <= 50 ? n : 20;
})();

// How many thread replies to SCAN when resolving context. Slack returns thread
// replies oldest-first, so to find the recent tail (and to detect the bot's own
// participation anywhere in the thread) we pull a wide window in one call, then
// trim to CONTEXT_LIMIT for the agent. 200 covers essentially every real thread
// in a single request; the ~1% longer than that degrade to slightly-stale
// context rather than breaking.
const THREAD_SCAN_LIMIT = Math.max(CONTEXT_LIMIT, 200);

/**
 * Read the recent conversation straight from Slack so the agent has real
 * memory without depending on persisted thread state (which doesn't survive
 * serverless cold starts). In a thread we read the thread replies; otherwise
 * we read the channel/DM's recent history. Failures are logged loudly with the
 * Slack error code (never silently swallowed into an empty context — that was
 * the original "I don't have prior context in this thread" bug).
 */
async function fetchSlackContext(thread: BotThread, message: BotMessage): Promise<SlackContext> {
	const token = process.env.SLACK_BOT_TOKEN;
	const channelId = resolveChannelId(thread, message);
	if (!token || !channelId) {
		if (!channelId) console.warn("slack.context: could not resolve channel id — no context loaded");
		return { messages: [], botParticipated: false, channelId };
	}

	const raw = ((message as unknown as Record<string, unknown>).raw ?? {}) as { thread_ts?: string; ts?: string };
	const client = new WebClient(token, { timeout: 8_000 });
	const inThread = !!raw.thread_ts;

	let scanned: RawSlackMessage[];
	try {
		if (raw.thread_ts) {
			// Thread replies come back oldest-first: scan a wide window so we can
			// take the recent tail and detect the bot's participation anywhere.
			const res = await client.conversations.replies({
				channel: channelId,
				ts: raw.thread_ts,
				limit: THREAD_SCAN_LIMIT,
			});
			scanned = (res.messages ?? []) as RawSlackMessage[];
		} else {
			// Channel/DM history comes back newest-first; take the newest window and
			// flip to chronological order.
			const res = await client.conversations.history({ channel: channelId, limit: CONTEXT_LIMIT });
			scanned = ((res.messages ?? []) as RawSlackMessage[]).reverse();
		}
	} catch (err) {
		// Surface Slack's error code (e.g. not_in_channel, missing_scope) so a
		// failed context load is diagnosable from the logs instead of looking
		// like the thread was simply empty.
		const code =
			(err as { data?: { error?: string } })?.data?.error ?? (err instanceof Error ? err.message : "unknown");
		console.error("slack.context: fetch failed", { channel: channelId, inThread, error: code });
		return { messages: [], botParticipated: false, channelId };
	}

	const { userId, botId } = await getBotIdentity();
	// Participation is judged over the FULL scanned window (a bot reply may sit in
	// the middle of a long thread), but the agent only sees the trimmed window.
	const botParticipated = scanned.some((m) => m.ts !== raw.ts && isOurBotMessage(m, userId, botId));
	const forContext = inThread ? selectContextWindow(scanned, CONTEXT_LIMIT) : scanned;
	const { messages } = classifyThreadMessages(forContext, { botUserId: userId, botId, currentTs: raw.ts });
	return { messages, botParticipated, channelId };
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

// Follow-up replies in threads the bot is part of, WITHOUT a live subscription.
// `onSubscribedMessage` only fires when the thread was subscribed and that state
// survived (Redis) — it doesn't for cold serverless starts, or for threads the
// bot posted into proactively via /api/send (e.g. the Linear curator's prompts),
// which are never subscribed. This catch-all closes that gap: for any threaded
// reply that doesn't mention the bot and isn't already handled above, we load
// the thread and only engage if THIS bot has spoken in it (the participation
// gate) — so the bot answers replies to its own questions but never barges into
// unrelated human threads. Mentions are skipped here (onNewMention owns them).
bot.onNewMessage(/[\s\S]*/, async (thread, message) => {
	if (message.author.isBot) return;
	const text = message.text ?? "";
	if (!text.trim()) return;
	if (await mentionsBot(text)) return;

	const raw = ((message as unknown as Record<string, unknown>).raw ?? {}) as { thread_ts?: string };
	if (!raw.thread_ts) return; // only threaded replies, never top-level channel chatter

	if (!isAuthorized(message.author.userId)) return; // stay silent — no reply spam

	const context = await fetchSlackContext(thread, message);
	if (!context.botParticipated) return; // not our thread — ignore

	// Best-effort: persist the subscription so a future warm/Redis invocation
	// routes through onSubscribedMessage. Harmless (and a no-op read) without Redis.
	await thread.subscribe().catch(() => {});
	await handleMessage(thread, message, context);
});

// ---------------------------------------------------------------------------
// Emoji-reaction actions
// ---------------------------------------------------------------------------
//
// React to any message with a mapped emoji and the agent runs the configured
// action on your behalf (✅ = mark done, 🔖 = save to knowledge base, 👀 =
// summarize, ❓ = explain — see emoji-actions.ts). Zero config by default;
// customize or disable per-emoji via the EMOJI_ACTIONS env var. Requires the
// `reaction_added` bot event in the Slack app manifest.

/** Fetch the text of the message a reaction landed on (fallback path). */
async function fetchReactedMessageText(channelId: string, ts: string): Promise<string | null> {
	const token = process.env.SLACK_BOT_TOKEN;
	if (!token) return null;
	try {
		const client = new WebClient(token, { timeout: 8_000 });
		const res = await client.conversations.history({ channel: channelId, latest: ts, inclusive: true, limit: 1 });
		const msg = (res.messages ?? [])[0] as { text?: string; ts?: string } | undefined;
		return msg?.ts === ts ? (msg.text ?? null) : null;
	} catch (err) {
		console.error("Failed to fetch reacted message:", err instanceof Error ? err.name : "unknown");
		return null;
	}
}

bot.onReaction(async (event) => {
	if (!event.added || event.user.isBot) return;

	const instruction = resolveEmojiAction(event.rawEmoji);
	if (!instruction) return; // unmapped emoji — stay silent

	if (!isAuthorized(event.user.userId)) return; // no reply spam on stray reactions

	// The reacted message's text: from the event if the SDK resolved it,
	// otherwise fetched from Slack via the raw event's channel + ts.
	const raw = event.raw as { item?: { channel?: string; ts?: string } } | undefined;
	let targetText = event.message?.text ?? null;
	if (!targetText && raw?.item?.channel && raw.item.ts) {
		targetText = await fetchReactedMessageText(raw.item.channel, raw.item.ts);
	}
	if (!targetText) return; // nothing to act on (e.g. file-only message)

	const reactor = event.user.fullName || event.user.userName || event.user.userId;

	try {
		await event.thread.startTyping();
		const result = await agent.generate({
			messages: [
				{
					role: "user" as const,
					content: `${reactor} (<@${event.user.userId}>) reacted with :${event.rawEmoji}: to this Slack message:

"""
${targetText.slice(0, MAX_MSG_LENGTH)}
"""

Configured action for :${event.rawEmoji}:: ${instruction}

Carry out the action on behalf of ${reactor}. Use connected tools where the action needs them. If the message doesn't give you enough to act on, say so in one line instead of guessing.`,
				},
			],
		});
		const text = scrubSlackBroadcasts(await result.text).slice(0, MAX_MSG_LENGTH);
		if (text) await event.thread.post(text);
	} catch (err) {
		console.error("Emoji action error:", err instanceof Error ? err.name : "unknown");
		try {
			await event.thread.post(`Couldn't complete the :${event.rawEmoji}: action — check the deployment logs.`);
		} catch {
			console.error("Failed to post emoji-action error message");
		}
	}
});

// ---------------------------------------------------------------------------
// Slash commands
// ---------------------------------------------------------------------------
//
// Universal shortcuts that route to the agent. To use them, declare the
// matching commands in your Slack app manifest (bot/app-manifest.json) pointing
// at this same webhook URL. Slash commands are workspace-unique, so if another
// installed app already owns a name, pick a different one (or retire that app).

type SlashEvent = Parameters<Parameters<typeof bot.onSlashCommand>[1]>[0];

/** Run a slash command through the agent, gated by the same allowlist. */
async function runSlashCommand(event: SlashEvent, prompt: string): Promise<void> {
	if (!isAuthorized(event.user.userId)) {
		await event.channel.post(UNAUTHORIZED_MSG);
		return;
	}
	// Echo the invocation up front. Slack never posts the slash command itself to
	// the channel when the app replies via chat.postMessage, so from the user's
	// side their message just vanishes and a bot reply appears out of nowhere.
	// Posting the command back (immediately, before the agent runs) restores the
	// "I can see what I asked, then the answer" experience and doubles as a
	// working indicator while the agent thinks.
	const args = event.text?.trim();
	const invocation = `${event.command}${args ? ` ${args}` : ""}`;
	try {
		await event.channel.post(`> <@${event.user.userId}> \`${invocation}\``);
	} catch (err) {
		console.error("Slash command echo failed:", err instanceof Error ? err.name : "unknown");
	}
	try {
		const result = await agent.generate({ messages: [{ role: "user", content: prompt }] });
		const text = scrubSlackBroadcasts(await result.text).slice(0, MAX_MSG_LENGTH);
		await event.channel.post(text || "(done)");
	} catch (err) {
		console.error("Slash command error:", err instanceof Error ? err.name : "unknown");
		await event.channel.post("Something went wrong. Check the deployment logs.");
	}
}

// /ask — general question to the agent (uses any connected tools).
bot.onSlashCommand("/ask", (event) => runSlashCommand(event, event.text?.trim() || "What can you do?"));

// /note — save a URL (or text) to the knowledge base as a high-quality note.
bot.onSlashCommand("/note", (event) =>
	runSlashCommand(
		event,
		`Save this to the knowledge base as a complete, high-quality note using kbCreateNote. If it's a URL, fetch the page first and summarize it faithfully (don't invent details). Before saving, search the knowledge base for related notes and link them. Save it once — do not create duplicates. Content: ${event.text?.trim() ?? ""}`,
	),
);

// /find — search across every connected source.
// (Named /find, not /search: /search and /status are reserved Slack built-in
// commands that no app can register.)
bot.onSlashCommand("/find", (event) =>
	runSlashCommand(
		event,
		`Search every source you can (knowledge base, web, Linear, Slack) for the request below. If it asks for the "latest/newest/recent" of something, or names a timeframe, use the recency tools (linearRecentIssues, kbRecentNotes) and date filters instead of plain keyword search. Present the top results concisely with links. Request: ${event.text?.trim() ?? ""}`,
	),
);

// /botstatus — report connected-service status.
bot.onSlashCommand("/botstatus", (event) =>
	runSlashCommand(event, "Run the systemStatus tool and report which services are connected, using Slack mrkdwn."),
);
