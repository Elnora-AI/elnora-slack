import { describe, expect, it } from "vitest";
import {
	bareChannelId,
	classifyThreadMessages,
	isOurBotMessage,
	resolveChannelId,
	selectContextWindow,
} from "../thread-context";

describe("bareChannelId", () => {
	it("strips the slack: adapter prefix and any :ts suffix", () => {
		expect(bareChannelId("slack:C0123")).toBe("C0123");
		expect(bareChannelId("slack:D0XXXXXXXXX")).toBe("D0XXXXXXXXX");
		expect(bareChannelId("slack:C0123:1699999999.0001")).toBe("C0123");
	});
	it("leaves an already-bare id untouched", () => {
		expect(bareChannelId("C0123")).toBe("C0123");
	});
});

describe("resolveChannelId", () => {
	it("prefers the raw Slack event channel, already bare", () => {
		// raw.channel wins over the SDK's prefixed channelId
		expect(resolveChannelId({ channelId: "slack:CXXX" }, { raw: { channel: "D999" } })).toBe("D999");
	});

	it("strips the slack: prefix off the SDK's channelId (the prod regression)", () => {
		expect(resolveChannelId({ channelId: "slack:D0XXXXXXXXX", id: "slack:D0XXXXXXXXX" }, {})).toBe("D0XXXXXXXXX");
	});

	it("strips the prefix off a channel object's id", () => {
		expect(resolveChannelId({ channel: { id: "slack:C777" } }, {})).toBe("C777");
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

	it("attributes a third-party bot as a USER turn — never as our assistant", () => {
		const { messages, botParticipated } = classifyThreadMessages(
			[
				{ user: "USOMEONE", text: "hello", ts: "1" },
				{ bot_id: "BOTHER", username: "GitHub", text: "PR merged", ts: "2" },
				{ bot_id: "BOTHER2", text: "no username here", ts: "3" },
			],
			bot,
		);
		expect(botParticipated).toBe(false);
		expect(messages[0]).toEqual({ role: "user", content: "[from <@USOMEONE>] hello" });
		// foreign bot messages must NOT be attributed to the agent itself
		expect(messages[1]).toEqual({ role: "user", content: "[from GitHub] PR merged" });
		expect(messages[2]).toEqual({ role: "user", content: "[from an app] no username here" });
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

describe("isOurBotMessage", () => {
	it("matches on our bot user id or bot id, not on foreign bots", () => {
		expect(isOurBotMessage({ user: "UBOT" }, "UBOT", "BBOT")).toBe(true);
		expect(isOurBotMessage({ bot_id: "BBOT" }, "UBOT", "BBOT")).toBe(true);
		expect(isOurBotMessage({ bot_id: "BOTHER" }, "UBOT", "BBOT")).toBe(false);
		expect(isOurBotMessage({ user: "UHUMAN" }, "UBOT", "BBOT")).toBe(false);
		// null identity (auth.test failed) must never match
		expect(isOurBotMessage({ user: "UBOT", bot_id: "BBOT" }, null, null)).toBe(false);
	});
});

describe("selectContextWindow", () => {
	const mk = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `m${i}`, ts: `${i}` }));

	it("returns everything when at or under the limit", () => {
		const msgs = mk(5);
		expect(selectContextWindow(msgs, 10)).toBe(msgs);
		expect(selectContextWindow(msgs, 5)).toBe(msgs);
	});

	it("keeps the parent (index 0) plus the most-recent limit-1 messages", () => {
		const msgs = mk(50); // m0 (parent) .. m49 (newest)
		const win = selectContextWindow(msgs, 20);
		expect(win).toHaveLength(20);
		expect(win[0].ts).toBe("0"); // parent preserved
		expect(win[1].ts).toBe("31"); // then the last 19: m31..m49
		expect(win[win.length - 1].ts).toBe("49"); // newest kept
	});
});
