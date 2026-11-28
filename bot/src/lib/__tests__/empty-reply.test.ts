import { describe, expect, it } from "vitest";
import { emptyReplyText, stoppedText } from "../empty-reply";

describe("empty and stopped replies", () => {
	it("says a stopped run is not complete, and what it did", () => {
		expect(stoppedText(["webFetch", ...Array(14).fill("linearCreateIssue")])).toBe(
			"I ran out of time before I finished, so this is not complete. " +
				"Done so far: web fetch, linear create issue ×14. " +
				"Anything already created (notes, Linear issues) stays; ask me to continue for the rest.",
		);
	});

	it("calls a finished run with no text done", () => {
		expect(emptyReplyText(["kbCreateNote"])).toBe("Done, with no written reply. What I did: kb create note.");
	});
});
