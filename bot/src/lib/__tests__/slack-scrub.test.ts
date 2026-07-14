import { describe, expect, it } from "vitest";
import { scrubSlackBroadcasts } from "../slack-scrub";

describe("scrubSlackBroadcasts", () => {
	it("strips broadcast tokens", () => {
		expect(scrubSlackBroadcasts("<!channel> deploy done")).toBe(" deploy done");
		expect(scrubSlackBroadcasts("ping <!here> now")).toBe("ping now");
		expect(scrubSlackBroadcasts("<!everyone> hi")).toBe(" hi");
		expect(scrubSlackBroadcasts("<!subteam^S0123456|eng> review")).toBe(" review");
	});

	it("keeps individual user mentions", () => {
		expect(scrubSlackBroadcasts("thanks <@U07Q5TEKRTK>!")).toBe("thanks <@U07Q5TEKRTK>!");
	});

	it("leaves normal text, links, and newlines alone", () => {
		expect(scrubSlackBroadcasts("see <https://example.com|the docs>")).toBe("see <https://example.com|the docs>");
		expect(scrubSlackBroadcasts("line one\nline two")).toBe("line one\nline two");
	});
});
