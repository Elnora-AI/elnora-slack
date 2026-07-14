import { describe, expect, it } from "vitest";
import { DEFAULT_EMOJI_ACTIONS, emojiActionMap, normalizeEmojiName, resolveEmojiAction } from "../emoji-actions";

describe("normalizeEmojiName", () => {
	it("strips colons", () => {
		expect(normalizeEmojiName(":white_check_mark:")).toBe("white_check_mark");
	});

	it("strips skin-tone suffixes", () => {
		expect(normalizeEmojiName("thumbsup::skin-tone-4")).toBe("thumbsup");
		expect(normalizeEmojiName("wave::skin-tone-2")).toBe("wave");
	});

	it("lowercases and trims", () => {
		expect(normalizeEmojiName(" EYES ")).toBe("eyes");
	});
});

describe("emojiActionMap", () => {
	it("returns defaults when no override is set", () => {
		expect(emojiActionMap("")).toEqual(DEFAULT_EMOJI_ACTIONS);
		expect(emojiActionMap(undefined)).toEqual(DEFAULT_EMOJI_ACTIONS);
	});

	it("disables the feature entirely with 'off'", () => {
		expect(emojiActionMap("off")).toEqual({});
		expect(emojiActionMap("OFF")).toEqual({});
		expect(emojiActionMap("disabled")).toEqual({});
	});

	it("merges custom emoji over defaults", () => {
		const map = emojiActionMap('{"rocket":"Deploy it"}');
		expect(map.rocket).toBe("Deploy it");
		expect(map.white_check_mark).toBe(DEFAULT_EMOJI_ACTIONS.white_check_mark);
	});

	it("overrides a default instruction", () => {
		const map = emojiActionMap('{"white_check_mark":"Close the Jira ticket"}');
		expect(map.white_check_mark).toBe("Close the Jira ticket");
	});

	it("disables a single default with 'off' or empty string", () => {
		expect(emojiActionMap('{"eyes":"off"}').eyes).toBeUndefined();
		expect(emojiActionMap('{"eyes":""}').eyes).toBeUndefined();
	});

	it("normalizes colon-wrapped keys in the override", () => {
		const map = emojiActionMap('{":rocket:":"Deploy it"}');
		expect(map.rocket).toBe("Deploy it");
	});

	it("fails closed on malformed JSON", () => {
		expect(emojiActionMap("{not json")).toEqual({});
	});

	it("fails closed on non-object JSON", () => {
		expect(emojiActionMap('["rocket"]')).toEqual({});
		expect(emojiActionMap('"rocket"')).toEqual({});
	});
});

describe("resolveEmojiAction", () => {
	it("resolves a default action from a raw reaction name", () => {
		expect(resolveEmojiAction("white_check_mark", "")).toBe(DEFAULT_EMOJI_ACTIONS.white_check_mark);
	});

	it("resolves through skin tones", () => {
		expect(resolveEmojiAction("thumbsup::skin-tone-3", '{"thumbsup":"Approve it"}')).toBe("Approve it");
	});

	it("returns null for unmapped emoji", () => {
		expect(resolveEmojiAction("taco", "")).toBeNull();
	});

	it("returns null when the feature is off", () => {
		expect(resolveEmojiAction("white_check_mark", "off")).toBeNull();
	});
});
