/**
 * Auto-generated from Slack OpenAPI spec — auth.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupAuthCommand(program: Command): void {
	const group = program.command("auth").description("auth.* API methods");

	group
		.command("revoke")
		.description("Revokes a token.")
		.option(
			"--test",
			"Setting this parameter to `1` triggers a _testing mode_ where the specified token will not actually be revoked.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.test !== undefined) args["test"] = opts.test;
				const result = await client.apiCall("auth.revoke", args);
				output(result);
			}),
		);

	group
		.command("test")
		.description("Checks authentication & identity.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				const result = await client.apiCall("auth.test", args);
				output(result);
			}),
		);
}
