/**
 * Auto-generated from Slack OpenAPI spec — usergroups.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupUsergroupsCommand(program: Command): void {
	const group = program.command("usergroups").description("usergroups.* API methods");

	group
		.command("create")
		.description("Create a User Group")
		.option(
			"--channels <value>",
			"A comma separated string of encoded channel IDs for which the User Group uses as a default.",
		)
		.option("--description <value>", "A short description of the User Group.")
		.option("--handle <value>", "A mention handle. Must be unique among channels, users and User Groups.")
		.option("--include-count", "Include the number of users in each User Group.")
		.requiredOption("--name <value>", "A name for the User Group. Must be unique among User Groups.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channels !== undefined) args["channels"] = opts.channels;
				if (opts.description !== undefined) args["description"] = opts.description;
				if (opts.handle !== undefined) args["handle"] = opts.handle;
				if (opts.includeCount !== undefined) args["include_count"] = opts.includeCount;
				if (opts.name !== undefined) args["name"] = opts.name;
				const result = await client.apiCall("usergroups.create", args);
				output(result);
			}),
		);

	group
		.command("disable")
		.description("Disable an existing User Group")
		.option("--include-count", "Include the number of users in the User Group.")
		.requiredOption("--usergroup <value>", "The encoded ID of the User Group to disable.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.includeCount !== undefined) args["include_count"] = opts.includeCount;
				if (opts.usergroup !== undefined) args["usergroup"] = opts.usergroup;
				const result = await client.apiCall("usergroups.disable", args);
				output(result);
			}),
		);

	group
		.command("enable")
		.description("Enable a User Group")
		.option("--include-count", "Include the number of users in the User Group.")
		.requiredOption("--usergroup <value>", "The encoded ID of the User Group to enable.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.includeCount !== undefined) args["include_count"] = opts.includeCount;
				if (opts.usergroup !== undefined) args["usergroup"] = opts.usergroup;
				const result = await client.apiCall("usergroups.enable", args);
				output(result);
			}),
		);

	group
		.command("list")
		.description("List all User Groups for a team")
		.option("--include-users", "Include the list of users for each User Group.")
		.option("--include-count", "Include the number of users in each User Group.")
		.option("--include-disabled", "Include disabled User Groups.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.includeUsers !== undefined) args["include_users"] = opts.includeUsers;
				if (opts.includeCount !== undefined) args["include_count"] = opts.includeCount;
				if (opts.includeDisabled !== undefined) args["include_disabled"] = opts.includeDisabled;
				const result = await client.apiCall("usergroups.list", args);
				output(result);
			}),
		);

	group
		.command("update")
		.description("Update an existing User Group")
		.option("--handle <value>", "A mention handle. Must be unique among channels, users and User Groups.")
		.option("--description <value>", "A short description of the User Group.")
		.option(
			"--channels <value>",
			"A comma separated string of encoded channel IDs for which the User Group uses as a default.",
		)
		.option("--include-count", "Include the number of users in the User Group.")
		.requiredOption("--usergroup <value>", "The encoded ID of the User Group to update.")
		.option("--name <value>", "A name for the User Group. Must be unique among User Groups.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.handle !== undefined) args["handle"] = opts.handle;
				if (opts.description !== undefined) args["description"] = opts.description;
				if (opts.channels !== undefined) args["channels"] = opts.channels;
				if (opts.includeCount !== undefined) args["include_count"] = opts.includeCount;
				if (opts.usergroup !== undefined) args["usergroup"] = opts.usergroup;
				if (opts.name !== undefined) args["name"] = opts.name;
				const result = await client.apiCall("usergroups.update", args);
				output(result);
			}),
		);

	group
		.command("users-list")
		.description("List all users in a User Group")
		.option("--include-disabled", "Allow results that involve disabled User Groups.")
		.requiredOption("--usergroup <value>", "The encoded ID of the User Group to update.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.includeDisabled !== undefined) args["include_disabled"] = opts.includeDisabled;
				if (opts.usergroup !== undefined) args["usergroup"] = opts.usergroup;
				const result = await client.apiCall("usergroups.users.list", args);
				output(result);
			}),
		);

	group
		.command("users-update")
		.description("Update the list of users for a User Group")
		.option("--include-count", "Include the number of users in the User Group.")
		.requiredOption("--usergroup <value>", "The encoded ID of the User Group to update.")
		.requiredOption(
			"--users <value>",
			"A comma separated string of encoded user IDs that represent the entire list of users for the User Group.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.includeCount !== undefined) args["include_count"] = opts.includeCount;
				if (opts.usergroup !== undefined) args["usergroup"] = opts.usergroup;
				if (opts.users !== undefined) args["users"] = opts.users;
				const result = await client.apiCall("usergroups.users.update", args);
				output(result);
			}),
		);
}
