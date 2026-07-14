import { afterEach, describe, expect, it, vi } from "vitest";
import { verifySecret } from "../auth";

function req(auth?: string): Request {
	return new Request("https://example.com/api/send", {
		method: "POST",
		headers: auth ? { authorization: auth } : {},
	});
}

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("verifySecret", () => {
	it("returns 500 when the secret env is missing", () => {
		vi.stubEnv("TEST_SECRET", "");
		const res = verifySecret(req("Bearer whatever"), "TEST_SECRET");
		expect(res?.status).toBe(500);
	});

	it("returns 401 on a wrong token", () => {
		vi.stubEnv("TEST_SECRET", "s3cret");
		expect(verifySecret(req("Bearer wrong!"), "TEST_SECRET")?.status).toBe(401);
		expect(verifySecret(req(), "TEST_SECRET")?.status).toBe(401);
	});

	it("returns null on the correct token", () => {
		vi.stubEnv("TEST_SECRET", "s3cret");
		expect(verifySecret(req("Bearer s3cret"), "TEST_SECRET")).toBeNull();
	});
});
