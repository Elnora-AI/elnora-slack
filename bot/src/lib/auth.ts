/**
 * Bearer-token verification with timing-safe comparison.
 */

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Verify a bearer token from the Authorization header against the secret in
 * the named env var. Returns null if auth passes, or an error Response.
 */
export function verifySecret(request: Request, envKey: string): NextResponse | null {
	const secret = process.env[envKey];
	if (!secret) {
		return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
	}

	const authHeader = request.headers.get("authorization") ?? "";
	const expected = `Bearer ${secret}`;

	if (authHeader.length !== expected.length || !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	return null;
}
