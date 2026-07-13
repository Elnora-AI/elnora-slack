/**
 * Auto-generated from Slack OpenAPI spec — bots.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupBotsCommand(program: Command): void {
	const group = program.command("bots").description("bots.* API methods");

	group
		.command("info")
		.description("Gets information about a bot user.")
		.option("--bot <value>", "Bot user to get info on")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.bot !== undefined) args["bot"] = opts.bot;
				const result = await client.apiCall("bots.info", args);
				output(result);
			}),
		);
}
