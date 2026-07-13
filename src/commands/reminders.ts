/**
 * Auto-generated from Slack OpenAPI spec — reminders.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupRemindersCommand(program: Command): void {
	const group = program.command("reminders").description("reminders.* API methods");

	group
		.command("add")
		.description("Creates a reminder.")
		.requiredOption("--text <value>", "The content of the reminder")
		.requiredOption(
			"--time <value>",
			'When this reminder should happen: the Unix timestamp (up to five years from now), the number of seconds until the reminder (if within 24 hours), or a natural language description (Ex. "in 15 minutes," or "every Thursday")',
		)
		.option(
			"--user <value>",
			"The user who will receive the reminder. If no user is specified, the reminder will go to user who created it.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.text !== undefined) args["text"] = opts.text;
				if (opts.time !== undefined) args["time"] = opts.time;
				if (opts.user !== undefined) args["user"] = opts.user;
				const result = await client.apiCall("reminders.add", args);
				output(result);
			}),
		);

	group
		.command("complete")
		.description("Marks a reminder as complete.")
		.option("--reminder <value>", "The ID of the reminder to be marked as complete")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.reminder !== undefined) args["reminder"] = opts.reminder;
				const result = await client.apiCall("reminders.complete", args);
				output(result);
			}),
		);

	group
		.command("delete")
		.description("Deletes a reminder.")
		.option("--reminder <value>", "The ID of the reminder")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.reminder !== undefined) args["reminder"] = opts.reminder;
				const result = await client.apiCall("reminders.delete", args);
				output(result);
			}),
		);

	group
		.command("info")
		.description("Gets information about a reminder.")
		.option("--reminder <value>", "The ID of the reminder")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.reminder !== undefined) args["reminder"] = opts.reminder;
				const result = await client.apiCall("reminders.info", args);
				output(result);
			}),
		);

	group
		.command("list")
		.description("Lists all reminders created by or for a given user.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				const result = await client.apiCall("reminders.list", args);
				output(result);
			}),
		);
}
