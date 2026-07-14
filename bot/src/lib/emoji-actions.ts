/**
 * Emoji-reaction actions — react to a message with a mapped emoji and the
 * agent carries out the action on your behalf. Works out of the box with
 * sensible defaults; nothing to configure unless you want to change them.
 *
 * Configuration (optional):
 *   EMOJI_ACTIONS — JSON object mapping Slack emoji names to instructions,
 *     merged over the defaults. Map an emoji to "off" (or "") to disable
 *     that one emoji. Set the whole var to "off" to disable the feature.
 *
 *     EMOJI_ACTIONS={"rocket":"Deploy the thing described in this message","eyes":"off"}
 */

export const DEFAULT_EMOJI_ACTIONS: Record<string, string> = {
	white_check_mark:
		"The user marked this message as DONE. If it references a task or issue in a connected tracker (e.g. Linear), find that issue and mark it done/closed. Otherwise just confirm it's been noted as completed. Reply with one line saying exactly what you did.",
	bookmark:
		"Save this message to the knowledge base as a note (fetch and summarize any URL it contains). Reply with one line confirming where it was saved.",
	eyes: "Summarize this conversation so far — key points and any open questions or action items. Keep it short.",
	question:
		"Explain this message in plain terms: expand abbreviations, add missing context from connected tools if useful, and state what (if anything) the reader is being asked to do.",
};

const OFF_VALUES = new Set(["off", "false", "disabled", "none", "0"]);

/**
 * Build the effective emoji → instruction map from defaults + EMOJI_ACTIONS.
 * Returns an empty map when the feature is disabled or the override is
 * malformed JSON (fail closed on config errors, loud in the logs).
 */
export function emojiActionMap(overrideRaw = process.env.EMOJI_ACTIONS): Record<string, string> {
	const raw = (overrideRaw ?? "").trim();
	if (OFF_VALUES.has(raw.toLowerCase())) return {};
	if (!raw) return { ...DEFAULT_EMOJI_ACTIONS };

	let override: unknown;
	try {
		override = JSON.parse(raw);
	} catch {
		console.error("EMOJI_ACTIONS is not valid JSON — emoji actions disabled until fixed.");
		return {};
	}
	if (typeof override !== "object" || override === null || Array.isArray(override)) {
		console.error("EMOJI_ACTIONS must be a JSON object of {emoji_name: instruction} — emoji actions disabled.");
		return {};
	}

	const map: Record<string, string> = { ...DEFAULT_EMOJI_ACTIONS };
	for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
		const emoji = normalizeEmojiName(key);
		if (typeof value !== "string" || OFF_VALUES.has(value.trim().toLowerCase()) || value.trim() === "") {
			delete map[emoji];
		} else {
			map[emoji] = value.trim();
		}
	}
	return map;
}

/**
 * Normalize a raw Slack emoji name: strip colons and skin-tone suffixes so
 * ":white_check_mark:" and "thumbsup::skin-tone-4" both resolve.
 */
export function normalizeEmojiName(rawEmoji: string): string {
	return rawEmoji
		.replace(/:/g, "")
		.replace(/skin-tone-\d+$/, "")
		.trim()
		.toLowerCase();
}

/** Resolve the configured instruction for a raw reaction emoji, or null. */
export function resolveEmojiAction(rawEmoji: string, overrideRaw = process.env.EMOJI_ACTIONS): string | null {
	return emojiActionMap(overrideRaw)[normalizeEmojiName(rawEmoji)] ?? null;
}
