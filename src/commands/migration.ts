/**
 * Auto-generated from Slack OpenAPI spec — migration.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupMigrationCommand(program: Command): void {
	const group = program.command("migration").description("migration.* API methods");

	group
		.command("exchange")
		.description("For Enterprise Grid workspaces, map local user IDs to global user IDs")
		.requiredOption("--users <value>", "A comma-separated list of user ids, up to 400 per request")
		.option("--team-id <value>", "Specify team_id starts with `T` in case of Org Token")
		.option(
			"--to-old",
			"Specify `true` to convert `W` global user IDs to workspace-specific `U` IDs. Defaults to `false`.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.users !== undefined) args["users"] = opts.users;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.toOld !== undefined) args["to_old"] = opts.toOld;
				const result = await client.apiCall("migration.exchange", args);
				output(result);
			}),
		);
}
