/**
 * Chat SDK webhook handler — single route for all platforms.
 *
 * Slack events, interactions, and slash commands all arrive here.
 *
 * URL: POST /api/webhooks/slack
 */

import { after } from "next/server";
import { bot } from "@/lib/bot";

type Platform = keyof typeof bot.webhooks;

/** Allow long-running agent responses (Vercel Pro / fluid compute: max 300s) */
export const maxDuration = 300;

export async function POST(request: Request, { params }: { params: Promise<{ platform: string }> }): Promise<Response> {
	const { platform } = await params;

	// Slack retries when the initial request is slow (http_timeout). Those are
	// safe to drop — the original is still processing via waitUntil/after().
	// Other retry reasons (e.g. the original genuinely failed) should be allowed
	// through so the message isn't silently lost.
	if (request.headers.get("X-Slack-Retry-Reason") === "http_timeout") {
		return new Response("OK (timeout retry ignored)", { status: 200 });
	}

	const webhookHandler = bot.webhooks[platform as Platform];
	if (!webhookHandler) {
		return new Response("Unknown platform", { status: 404 });
	}

	return webhookHandler(request, {
		waitUntil: (task) => after(() => task),
	});
}

/** Health check + Slack URL verification challenge */
export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }): Promise<Response> {
	const { platform } = await params;

	const webhookHandler = bot.webhooks[platform as Platform];
	if (!webhookHandler) {
		return new Response("Platform not configured", { status: 404 });
	}

	// Handle Slack URL verification challenge
	const url = new URL(request.url);
	if (url.searchParams.has("challenge")) {
		return webhookHandler(request);
	}

	return new Response(`${platform} webhook endpoint is active`, { status: 200 });
}
