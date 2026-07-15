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
 * Resolve the Slack channel id for a thread/message. Defensive by design:
 * tries the adapter's public `channelId`, then the raw event's `channel`,
 * then a `channel` object, then the `slack:C…:ts` thread key. A silent failure
 * here is what makes the bot "forget" a thread, so every known shape is covered.
 */
export function resolveChannelId(thread: unknown, message: unknown): string | null {
	const t = (thread ?? {}) as Record<string, unknown>;
	const m = (message ?? {}) as Record<string, unknown>;

	if (typeof t.channelId === "string" && t.channelId) return t.channelId;

	const rawChannel = (m.raw as { channel?: string } | undefined)?.channel;
	if (typeof rawChannel === "string" && rawChannel) return rawChannel;

	const channelObj = t.channel as { id?: string } | undefined;
	if (channelObj && typeof channelObj.id === "string" && channelObj.id) return channelObj.id;

	for (const v of [t.threadId, t.id]) {
		if (typeof v === "string") {
			const mt = v.match(/^slack:([^:]+)/);
			if (mt) return mt[1];
		}
	}
	return null;
}

/**
 * Turn raw Slack messages into agent turns and report whether THIS bot
 * participated. The bot's own posts — matched by user id OR bot id, which
 * covers both live agent replies and proactive /api/send posts (e.g. the
 * Linear curator's prompts) — become `assistant` turns; everyone else's become
 * attributed `user` turns. The current message (by ts) is excluded.
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
			const isOurBot = (!!opts.botUserId && x.user === opts.botUserId) || (!!opts.botId && x.bot_id === opts.botId);
			if (isOurBot) botParticipated = true;
			const isAssistant = isOurBot || !!x.bot_id;
			const text = (x.text as string).slice(0, maxLen);
			return {
				role: isAssistant ? "assistant" : "user",
				// Attribute human turns with the sender's Slack ID so the agent can
				// tell speakers apart in multi-person channels.
				content: isAssistant || !x.user ? text : `[from <@${x.user}>] ${text}`,
			};
		});
	return { messages, botParticipated };
}
