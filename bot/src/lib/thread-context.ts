/**
 * Pure helpers for turning Slack thread/channel history into agent context.
 *
 * Kept free of the Slack SDK and any I/O so the routing logic — channel
 * resolution and "did this bot already speak here?" — is unit-testable. The
 * live fetch that calls these lives in bot.ts.
 */

/** Max characters kept per message (matches Slack's per-message limit). */
export const MAX_MSG_LENGTH = 4000;

/** A raw Slack message as returned by conversations.replies/history. */
export interface RawSlackMessage {
	user?: string;
	bot_id?: string;
	username?: string;
	text?: string;
	ts?: string;
}

/** A single agent turn. */
export interface ContextMessage {
	role: "user" | "assistant";
	content: string;
}

/** The conversation context handed to the agent, plus routing metadata. */
export interface SlackContext {
	messages: ContextMessage[];
	/** True if THIS bot has spoken in the thread — the follow-up gate. */
	botParticipated: boolean;
	channelId: string | null;
}

/**
 * Strip the chat-SDK's `slack:` adapter prefix (and any `:ts` suffix) to get the
 * bare Slack channel id the Web API expects. The SDK's `thread.channelId` and
 * thread keys look like `slack:C0123` or `slack:C0123:1699…`; Slack's
 * conversations.* endpoints need `C0123`, and passing the prefixed form fails
 * with `channel_not_found`.
 */
export function bareChannelId(raw: string): string {
	const m = raw.match(/^slack:([^:]+)/);
	return m ? m[1] : raw;
}

/**
 * Resolve the bare Slack channel id for a thread/message. Defensive by design:
 * prefers the raw Slack event's `channel` (already bare and authoritative),
 * then the SDK's `channelId`, a `channel` object, or the `slack:C…:ts` thread
 * key — normalizing the adapter prefix off each. A silent failure here is what
 * makes the bot "forget" a thread, so every known shape is covered.
 */
export function resolveChannelId(thread: unknown, message: unknown): string | null {
	const t = (thread ?? {}) as Record<string, unknown>;
	const m = (message ?? {}) as Record<string, unknown>;

	// The Slack event's channel field is the authoritative bare id (C…/D…/G…).
	const rawChannel = (m.raw as { channel?: string } | undefined)?.channel;
	if (typeof rawChannel === "string" && rawChannel) return bareChannelId(rawChannel);

	// The SDK's channelId carries the `slack:` prefix — strip it.
	if (typeof t.channelId === "string" && t.channelId) return bareChannelId(t.channelId);

	const channelObj = t.channel as { id?: string } | undefined;
	if (channelObj && typeof channelObj.id === "string" && channelObj.id) return bareChannelId(channelObj.id);

	for (const v of [t.threadId, t.id]) {
		if (typeof v === "string") {
			const mt = v.match(/^slack:([^:]+)/);
			if (mt) return mt[1];
		}
	}
	return null;
}

/** True if a raw Slack message was posted by THIS bot (live agent reply or a
 * proactive /api/send post, e.g. the Linear curator's prompts). Matches on the
 * bot's user id OR bot id. Other apps' bot messages return false. */
export function isOurBotMessage(msg: RawSlackMessage, botUserId: string | null, botId: string | null): boolean {
	return (!!botUserId && msg.user === botUserId) || (!!botId && msg.bot_id === botId);
}

/**
 * Turn raw Slack messages into agent turns and report whether THIS bot
 * participated. Only THIS bot's posts become `assistant` turns; everyone else —
 * humans AND other apps' bots (GitHub, PagerDuty, …) — become attributed `user`
 * turns, so the agent never mistakes a third-party notification for something it
 * said. The current message (by ts) is excluded.
 */
export function classifyThreadMessages(
	msgs: RawSlackMessage[],
	opts: { botUserId: string | null; botId: string | null; currentTs?: string; maxLen?: number },
): { messages: ContextMessage[]; botParticipated: boolean } {
	const maxLen = opts.maxLen ?? MAX_MSG_LENGTH;
	let botParticipated = false;
	const messages = msgs
		.filter((x) => x.text && x.ts !== opts.currentTs)
		.map((x): ContextMessage => {
			const isOurBot = isOurBotMessage(x, opts.botUserId, opts.botId);
			if (isOurBot) botParticipated = true;
			const text = (x.text as string).slice(0, maxLen);
			if (isOurBot) return { role: "assistant", content: text };
			// Everyone else is attributed so the agent can tell speakers apart in
			// multi-person threads and can't confuse another app's post with its own.
			const who = x.user ? `<@${x.user}>` : (x.username ?? "an app");
			return { role: "user", content: `[from ${who}] ${text}` };
		});
	return { messages, botParticipated };
}

/**
 * Trim a fetched thread (oldest-first, index 0 = the thread parent) to the
 * window the agent should see: the parent (often the bot's own question) plus
 * the most-recent `limit-1` messages. Slack returns thread replies oldest-first,
 * so without this a long thread would feed the agent its opening messages
 * instead of the recent turns the current reply is actually responding to.
 */
export function selectContextWindow(msgs: RawSlackMessage[], limit: number): RawSlackMessage[] {
	if (limit <= 0 || msgs.length <= limit) return msgs;
	return [msgs[0], ...msgs.slice(-(limit - 1))];
}
