import { describe, expect, it } from "vitest";
import { classifyThreadMessages, resolveChannelId } from "../thread-context";

describe("resolveChannelId", () => {
	it("prefers the adapter's public channelId", () => {
		expect(resolveChannelId({ channelId: "C123", id: "slack:CXXX:1.2" }, {})).toBe("C123");
	});

	it("falls back to the raw Slack event's channel", () => {
		expect(resolveChannelId({}, { raw: { channel: "D999" } })).toBe("D999");
	});

	it("falls back to a channel object's id", () => {
		expect(resolveChannelId({ channel: { id: "C777" } }, {})).toBe("C777");
	});

	it("parses the slack:<channel>:<ts> thread key", () => {
		expect(resolveChannelId({ id: "slack:C555:1712345678.9001" }, {})).toBe("C555");
		expect(resolveChannelId({ threadId: "slack:D42:1.2" }, {})).toBe("D42");
	});

	it("returns null when nothing resolves", () => {
		expect(resolveChannelId({}, {})).toBeNull();
		expect(resolveChannelId(undefined, undefined)).toBeNull();
	});
});

describe("classifyThreadMessages", () => {
	const bot = { botUserId: "UBOT", botId: "BBOT" };

	it("maps our bot's messages to assistant turns and detects participation", () => {
		const { messages, botParticipated } = classifyThreadMessages(
			[
				{ user: "UBOT", bot_id: "BBOT", text: "What do you want to do with ELN-958?", ts: "1" },
				{ user: "UCARMEN", text: "Mark it done.", ts: "2" },
			],
			{ ...bot, currentTs: "2" },
		);
		expect(botParticipated).toBe(true);
		// current message (ts 2) is excluded; only the bot's prior turn remains
		expect(messages).toEqual([{ role: "assistant", content: "What do you want to do with ELN-958?" }]);
	});

	it("attributes human turns and does NOT flag participation for other bots", () => {
		const { messages, botParticipated } = classifyThreadMessages(
			[
				{ user: "USOMEONE", text: "hello", ts: "1" },
				{ bot_id: "BOTHER", text: "I am a different bot", ts: "2" },
			],
			bot,
		);
		expect(botParticipated).toBe(false);
		expect(messages[0]).toEqual({ role: "user", content: "[from <@USOMEONE>] hello" });
		// another bot's message is still context (assistant-ish) but not OUR participation
		expect(messages[1].role).toBe("assistant");
	});

	it("detects participation by bot_id even if user id is absent", () => {
		const { botParticipated } = classifyThreadMessages(
			[{ bot_id: "BBOT", text: "posted via /api/send", ts: "1" }],
			bot,
		);
		expect(botParticipated).toBe(true);
	});

	it("drops empty messages and truncates to maxLen", () => {
		const { messages } = classifyThreadMessages(
			[
				{ user: "U1", text: "", ts: "1" },
				{ user: "U1", text: "abcdef", ts: "2" },
			],
			{ ...bot, maxLen: 3 },
		);
		expect(messages).toHaveLength(1);
		expect(messages[0].content).toBe("[from <@U1>] abc");
	});
});
