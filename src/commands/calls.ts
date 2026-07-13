/**
 * Auto-generated from Slack OpenAPI spec — calls.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupCallsCommand(program: Command): void {
	const group = program.command("calls").description("calls.* API methods");

	group
		.command("add")
		.description("Registers a new Call.")
		.requiredOption(
			"--external-unique-id <value>",
			"An ID supplied by the 3rd-party Call provider. It must be unique across all Calls from that service.",
		)
		.option(
			"--external-display-id <value>",
			"An optional, human-readable ID supplied by the 3rd-party Call provider. If supplied, this ID will be displayed in the Call object.",
		)
		.requiredOption("--join-url <value>", "The URL required for a client to join the Call.")
		.option(
			"--desktop-app-join-url <value>",
			"When supplied, available Slack clients will attempt to directly launch the 3rd-party Call with this URL.",
		)
		.option("--date-start <value>", "Call start time in UTC UNIX timestamp format")
		.option("--title <value>", "The name of the Call.")
		.option(
			"--created-by <value>",
			"The valid Slack user ID of the user who created this Call. When this method is called with a user token, the `created_by` field is optional and defaults to the authed user of the token. Otherwise, the field is required.",
		)
		.option(
			"--users <value>",
			"The list of users to register as participants in the Call. [Read more on how to specify users here](/apis/calls#users).",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.externalUniqueId !== undefined) args["external_unique_id"] = opts.externalUniqueId;
				if (opts.externalDisplayId !== undefined) args["external_display_id"] = opts.externalDisplayId;
				if (opts.joinUrl !== undefined) args["join_url"] = opts.joinUrl;
				if (opts.desktopAppJoinUrl !== undefined) args["desktop_app_join_url"] = opts.desktopAppJoinUrl;
				if (opts.dateStart !== undefined) args["date_start"] = opts.dateStart;
				if (opts.title !== undefined) args["title"] = opts.title;
				if (opts.createdBy !== undefined) args["created_by"] = opts.createdBy;
				if (opts.users !== undefined) args["users"] = opts.users;
				const result = await client.apiCall("calls.add", args);
				output(result);
			}),
		);

	group
		.command("end")
		.description("Ends a Call.")
		.requiredOption(
			"--id <value>",
			"`id` returned when registering the call using the [`calls.add`](/methods/calls.add) method.",
		)
		.option("--duration <value>", "Call duration in seconds")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.id !== undefined) args["id"] = opts.id;
				if (opts.duration !== undefined) args["duration"] = opts.duration;
				const result = await client.apiCall("calls.end", args);
				output(result);
			}),
		);

	group
		.command("info")
		.description("Returns information about a Call.")
		.requiredOption("--id <value>", "`id` of the Call returned by the [`calls.add`](/methods/calls.add) method.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.id !== undefined) args["id"] = opts.id;
				const result = await client.apiCall("calls.info", args);
				output(result);
			}),
		);

	group
		.command("participants-add")
		.description("Registers new participants added to a Call.")
		.requiredOption("--id <value>", "`id` returned by the [`calls.add`](/methods/calls.add) method.")
		.requiredOption(
			"--users <value>",
			"The list of users to add as participants in the Call. [Read more on how to specify users here](/apis/calls#users).",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.id !== undefined) args["id"] = opts.id;
				if (opts.users !== undefined) args["users"] = opts.users;
				const result = await client.apiCall("calls.participants.add", args);
				output(result);
			}),
		);

	group
		.command("participants-remove")
		.description("Registers participants removed from a Call.")
		.requiredOption("--id <value>", "`id` returned by the [`calls.add`](/methods/calls.add) method.")
		.requiredOption(
			"--users <value>",
			"The list of users to remove as participants in the Call. [Read more on how to specify users here](/apis/calls#users).",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.id !== undefined) args["id"] = opts.id;
				if (opts.users !== undefined) args["users"] = opts.users;
				const result = await client.apiCall("calls.participants.remove", args);
				output(result);
			}),
		);

	group
		.command("update")
		.description("Updates information about a Call.")
		.requiredOption("--id <value>", "`id` returned by the [`calls.add`](/methods/calls.add) method.")
		.option("--title <value>", "The name of the Call.")
		.option("--join-url <value>", "The URL required for a client to join the Call.")
		.option(
			"--desktop-app-join-url <value>",
			"When supplied, available Slack clients will attempt to directly launch the 3rd-party Call with this URL.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.id !== undefined) args["id"] = opts.id;
				if (opts.title !== undefined) args["title"] = opts.title;
				if (opts.joinUrl !== undefined) args["join_url"] = opts.joinUrl;
				if (opts.desktopAppJoinUrl !== undefined) args["desktop_app_join_url"] = opts.desktopAppJoinUrl;
				const result = await client.apiCall("calls.update", args);
				output(result);
			}),
		);
}
