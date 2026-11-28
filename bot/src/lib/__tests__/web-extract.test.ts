import { describe, expect, it } from "vitest";
import { EXTRACT_PART_CHARS, pagePart } from "../page-part";

describe("pagePart", () => {
	it("hands out a long page in parts until nextOffset is null, so the whole text is read", () => {
		const text = "x".repeat(EXTRACT_PART_CHARS * 2 + 5);
		const parts = [];
		for (let offset: number | null = 0; offset !== null; ) {
			const part = pagePart(text, offset);
			parts.push(part);
			offset = part.nextOffset;
		}
		expect(parts.map((p) => p.offset)).toEqual([0, EXTRACT_PART_CHARS, EXTRACT_PART_CHARS * 2]);
		expect(parts.map((p) => p.content).join("")).toBe(text);
		expect(parts[0].totalChars).toBe(text.length);
	});
});
