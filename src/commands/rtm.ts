/**
 * Auto-generated from Slack OpenAPI spec — rtm.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupRtmCommand(program: Command): void {
	const group = program.command("rtm").description("rtm.* API methods");

	group
		.command("connect")
		.description("Starts a Real Time Messaging session.")
		.option(
			"--batch-presence-aware",
			"Batch presence deliveries via subscription. Enabling changes the shape of `presence_change` events. See [batch presence](/docs/presence-and-status#batching).",
		)
		.option(
			"--presence-sub",
			"Only deliver presence events when requested by subscription. See [presence subscriptions](/docs/presence-and-status#subscriptions).",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.batchPresenceAware !== undefined) args["batch_presence_aware"] = opts.batchPresenceAware;
				if (opts.presenceSub !== undefined) args["presence_sub"] = opts.presenceSub;
				const result = await client.apiCall("rtm.connect", args);
				output(result);
			}),
		);
}
