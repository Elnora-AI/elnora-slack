/**
 * Outbound Slack messaging endpoint — lets your other automations (CLI,
 * scheduled jobs, CI) post as the bot.
 *
 * POST /api/send — send a message to a Slack channel or user DM.
 *
 * Body:
 *   { "channel": "C0XXXXXXX" | "slack:C0XXXXXXX" | "<name with SLACK_CHANNEL_<NAME> set>", "message": "Hello!" }
 *   { "user": "U0XXXXXXX", "message": "Hey!" }
 *
 * Auth: Bearer token via SEND_API_SECRET. The route is disabled (503) until
 * that env var is set.
 *
 * Usage:
 *   curl -X POST https://<your-deployment>/api/send \
 *     -H "Authorization: Bearer $SEND_API_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"channel": "C0XXXXXXX", "message": "Hello from the bot!"}'
 */

import { verifySecret } from "@/lib/auth";
import { bot } from "@/lib/bot";
import { resolveChannelId } from "@/lib/slack-channels";

interface SendPayload {
	channel?: string;
	user?: string;
	message: string;
}

export async function POST(request: Request) {
	if (!process.env.SEND_API_SECRET) {
		return Response.json({ error: "Send API disabled — SEND_API_SECRET not configured" }, { status: 503 });
	}
	const authError = verifySecret(request, "SEND_API_SECRET");
	if (authError) return authError;

	try {
		const payload = (await request.json()) as SendPayload;
		const { channel, user, message } = payload;

		if (!message) {
			return Response.json({ error: "message is required" }, { status: 400 });
		}

		if (!channel && !user) {
			return Response.json({ error: "Either channel or user is required" }, { status: 400 });
		}

		if (channel && user) {
			return Response.json({ error: "Provide channel or user, not both" }, { status: 400 });
		}

		if (user) {
			// DM a user
			const dmThread = await bot.openDM(user);
			await dmThread.post(message);
			return Response.json({ ok: true, type: "dm", user });
		}

		// Post to a channel
		const channelId = resolveChannelId(channel as string);
		const ch = bot.channel(channelId);
		await ch.post(message);
		return Response.json({ ok: true, type: "channel", channel: channelId });
	} catch (err) {
		// Strip CR/LF/tabs before logging — the error message can embed a
		// user-supplied channel string (resolveChannelId), so an attacker could
		// otherwise forge log entries (js/log-injection).
		const detail = (err instanceof Error ? err.message : "unknown").replace(/[\r\n\t]/g, " ");
		console.error("Send handler error:", detail);
		return Response.json({ error: "Internal error" }, { status: 500 });
	}
}
