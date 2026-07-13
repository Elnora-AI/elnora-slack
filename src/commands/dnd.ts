/**
 * Auto-generated from Slack OpenAPI spec — dnd.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupDndCommand(program: Command): void {
	const group = program.command("dnd").description("dnd.* API methods");

	group
		.command("endDnd")
		.description("Ends the current user's Do Not Disturb session immediately.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				const result = await client.apiCall("dnd.endDnd", args);
				output(result);
			}),
		);

	group
		.command("endSnooze")
		.description("Ends the current user's snooze mode immediately.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				const result = await client.apiCall("dnd.endSnooze", args);
				output(result);
			}),
		);

	group
		.command("info")
		.description("Retrieves a user's current Do Not Disturb status.")
		.option("--user <value>", "User to fetch status for (defaults to current user)")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.user !== undefined) args["user"] = opts.user;
				const result = await client.apiCall("dnd.info", args);
				output(result);
			}),
		);

	group
		.command("setSnooze")
		.description("Turns on Do Not Disturb mode for the current user, or changes its duration.")
		.requiredOption("--num-minutes <value>", "Number of minutes, from now, to snooze until.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.numMinutes !== undefined) args["num_minutes"] = opts.numMinutes;
				const result = await client.apiCall("dnd.setSnooze", args);
				output(result);
			}),
		);

	group
		.command("teamInfo")
		.description("Retrieves the Do Not Disturb status for up to 50 users on a team.")
		.option("--users <value>", "Comma-separated list of users to fetch Do Not Disturb status for")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.users !== undefined) args["users"] = opts.users;
				const result = await client.apiCall("dnd.teamInfo", args);
				output(result);
			}),
		);
}
