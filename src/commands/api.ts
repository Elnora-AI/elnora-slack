/**
 * Auto-generated from Slack OpenAPI spec — api.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupApiCommand(program: Command): void {
	const group = program.command("api").description("api.* API methods");

	group
		.command("test")
		.description("Checks API calling code.")
		.option("--error <value>", "Error response to return")
		.option("--foo <value>", "example property to return")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.error !== undefined) args["error"] = opts.error;
				if (opts.foo !== undefined) args["foo"] = opts.foo;
				const result = await client.apiCall("api.test", args);
				output(result);
			}),
		);
}
