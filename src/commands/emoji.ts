/**
 * Auto-generated from Slack OpenAPI spec — emoji.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupEmojiCommand(program: Command): void {
	const group = program.command("emoji").description("emoji.* API methods");

	group
		.command("list")
		.description("Lists custom emoji for a team.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				const result = await client.apiCall("emoji.list", args);
				output(result);
			}),
		);
}
