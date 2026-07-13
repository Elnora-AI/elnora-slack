/**
 * Auto-generated from Slack OpenAPI spec — dialog.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupDialogCommand(program: Command): void {
	const group = program.command("dialog").description("dialog.* API methods");

	group
		.command("open")
		.description("Open a dialog with a user")
		.requiredOption("--dialog <value>", "The dialog definition. This must be a JSON-encoded string.")
		.requiredOption("--trigger-id <value>", "Exchange a trigger to post to the user.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.dialog !== undefined) args["dialog"] = opts.dialog;
				if (opts.triggerId !== undefined) args["trigger_id"] = opts.triggerId;
				const result = await client.apiCall("dialog.open", args);
				output(result);
			}),
		);
}
