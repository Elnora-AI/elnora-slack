import { describe, expect, it } from "vitest";
import { isAuthorized } from "../authorize";

describe("isAuthorized", () => {
	it("allows everyone when the allowlist is unset (workspace-wide default)", () => {
		expect(isAuthorized("U123", undefined)).toBe(true);
	});

	it("allows everyone when the allowlist is empty", () => {
		expect(isAuthorized("U123", "")).toBe(true);
		expect(isAuthorized("U123", "   ")).toBe(true);
	});

	it("allows everyone when the allowlist is '*'", () => {
		expect(isAuthorized("U123", "*")).toBe(true);
	});

	it("restricts to listed users when a CSV is set", () => {
		expect(isAuthorized("U123", "U123,U456")).toBe(true);
		expect(isAuthorized("U456", "U123,U456")).toBe(true);
		expect(isAuthorized("U789", "U123,U456")).toBe(false);
	});

	it("tolerates whitespace and trailing commas in the CSV", () => {
		expect(isAuthorized("U456", " U123 , U456 ,")).toBe(true);
		expect(isAuthorized("U789", " U123 , U456 ,")).toBe(false);
	});

	it("always rejects a missing user id", () => {
		expect(isAuthorized(undefined, "*")).toBe(false);
		expect(isAuthorized(undefined, "")).toBe(false);
		expect(isAuthorized("", "U123")).toBe(false);
	});
});
