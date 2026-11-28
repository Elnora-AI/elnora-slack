/**
 * Continues an agent run that outlasted its invocation (see runAndReply in lib/bot.ts).
 *
 * POST /api/continue  { "key": "agent-run:<uuid>" }
 *
 * The bot calls this on itself. The key is a one-time random id for the run
 * stored in Redis: an unknown, expired or already-used key does nothing, so
 * the route needs no secret of its own.
 */

import { after } from "next/server";
import { continueAgentRun, takeAgentRun } from "@/lib/bot";

/** The same budget as the webhook route: the run continues for up to another 800s. */
export const maxDuration = 800;

export async function POST(request: Request): Promise<Response> {
	const body = (await request.json().catch(() => null)) as { key?: unknown } | null;
	if (typeof body?.key !== "string") return new Response("Bad request", { status: 400 });
	const job = await takeAgentRun(body.key);
	if (!job) return new Response("Not found", { status: 404 });
	after(() => continueAgentRun(job));
	return new Response("Accepted", { status: 202 });
}
