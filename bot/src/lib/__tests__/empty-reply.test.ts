import { describe, expect, it } from "vitest";
import { emptyReplyText } from "../empty-reply";

describe("emptyReplyText", () => {
	it("says a run that hit the step cap is not complete, and what it did", () => {
		const steps = [
			{ toolCalls: [{ toolName: "webFetch" }] },
			...Array.from({ length: 14 }, () => ({ toolCalls: [{ toolName: "linearCreateIssue" }] })),
		];
		expect(emptyReplyText(steps, 15)).toBe(
			"I stopped at my 15-step limit before I finished, so this is not complete. " +
				"Done so far: web fetch, linear create issue ×14. " +
				"Anything already created (notes, Linear issues) stays; ask me to continue for the rest.",
		);
	});

	it("calls a run under the cap done", () => {
		expect(emptyReplyText([{ toolCalls: [{ toolName: "kbCreateNote" }] }], 15)).toBe(
			"Done, with no written reply. What I did: kb create note.",
		);
	});
});
