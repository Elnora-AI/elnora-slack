import { describe, expect, it } from "vitest";
import { buildDateClauses, toDriveRfc3339 } from "../tools/knowledge-base";

describe("toDriveRfc3339", () => {
	it("converts a plain date to start-of-day by default", () => {
		expect(toDriveRfc3339("2026-07-15")).toBe("2026-07-15T00:00:00");
	});

	it("converts to end-of-day when requested", () => {
		expect(toDriveRfc3339("2026-07-15", true)).toBe("2026-07-15T23:59:59");
	});

	it("rejects anything that isn't a plain YYYY-MM-DD date", () => {
		expect(toDriveRfc3339(undefined)).toBeNull();
		expect(toDriveRfc3339("")).toBeNull();
		expect(toDriveRfc3339("2026/07/15")).toBeNull();
		expect(toDriveRfc3339("last tuesday")).toBeNull();
		// injection attempt is not a valid date, so it's dropped
		expect(toDriveRfc3339("2026-07-15' or name contains '")).toBeNull();
	});
});

describe("buildDateClauses", () => {
	it("builds a >= clause for modifiedAfter", () => {
		expect(buildDateClauses("2026-07-01", undefined)).toBe("modifiedTime >= '2026-07-01T00:00:00'");
	});

	it("builds a <= end-of-day clause for modifiedBefore", () => {
		expect(buildDateClauses(undefined, "2026-07-31")).toBe("modifiedTime <= '2026-07-31T23:59:59'");
	});

	it("combines both with and", () => {
		expect(buildDateClauses("2026-07-01", "2026-07-31")).toBe(
			"modifiedTime >= '2026-07-01T00:00:00' and modifiedTime <= '2026-07-31T23:59:59'",
		);
	});

	it("returns an empty string when no valid dates are given", () => {
		expect(buildDateClauses(undefined, undefined)).toBe("");
		expect(buildDateClauses("garbage", "also-garbage")).toBe("");
	});
});
