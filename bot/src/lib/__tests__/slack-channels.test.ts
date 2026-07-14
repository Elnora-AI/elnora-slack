import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveChannelId } from "../slack-channels";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("resolveChannelId", () => {
	it("passes through fully-qualified ids", () => {
		expect(resolveChannelId("slack:C012345678")).toBe("slack:C012345678");
	});

	it("prefixes raw Slack channel ids", () => {
		expect(resolveChannelId("C012345678")).toBe("slack:C012345678");
		expect(resolveChannelId("D012345678")).toBe("slack:D012345678");
	});

	it("resolves friendly names via SLACK_CHANNEL_<NAME> env vars", () => {
		vi.stubEnv("SLACK_CHANNEL_GENERAL", "C0AAAAAAAA");
		vi.stubEnv("SLACK_CHANNEL_WAR_ROOM", "C0BBBBBBBB");
		expect(resolveChannelId("general")).toBe("slack:C0AAAAAAAA");
		expect(resolveChannelId("war-room")).toBe("slack:C0BBBBBBBB");
	});

	it("throws on unknown names", () => {
		expect(() => resolveChannelId("nonexistent")).toThrow(/Unknown channel/);
	});
});
