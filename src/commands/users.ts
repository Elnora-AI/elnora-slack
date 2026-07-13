/**
 * Auto-generated from Slack OpenAPI spec — users.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupUsersCommand(program: Command): void {
	const group = program.command("users").description("users.* API methods");

	group
		.command("conversations")
		.description("List conversations the calling user may access.")
		.option(
			"--user <value>",
			"Browse conversations by a specific user ID's membership. Non-public channels are restricted to those where the calling user shares membership.",
		)
		.option(
			"--types <value>",
			"Mix and match channel types by providing a comma-separated list of any combination of `public_channel`, `private_channel`, `mpim`, `im`",
		)
		.option("--exclude-archived", "Set to `true` to exclude archived channels from the list")
		.option(
			"--limit <value>",
			"The maximum number of items to return. Fewer than the requested number of items may be returned, even if the end of the list hasn't been reached. Must be an integer no larger than 1000.",
		)
		.option(
			"--cursor <value>",
			'Paginate through collections of data by setting the `cursor` parameter to a `next_cursor` attribute returned by a previous request\'s `response_metadata`. Default value fetches the first "page" of the collection. See [pagination](/docs/pagination) for more detail.',
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.user !== undefined) args["user"] = opts.user;
				if (opts.types !== undefined) args["types"] = opts.types;
				if (opts.excludeArchived !== undefined) args["exclude_archived"] = opts.excludeArchived;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("users.conversations", args);
				output(result);
			}),
		);

	group
		.command("deletePhoto")
		.description("Delete the user profile photo")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				const result = await client.apiCall("users.deletePhoto", args);
				output(result);
			}),
		);

	group
		.command("getPresence")
		.description("Gets user presence information.")
		.option("--user <value>", "User to get presence info on. Defaults to the authed user.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.user !== undefined) args["user"] = opts.user;
				const result = await client.apiCall("users.getPresence", args);
				output(result);
			}),
		);

	group
		.command("identity")
		.description("Get a user's identity.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				const result = await client.apiCall("users.identity", args);
				output(result);
			}),
		);

	group
		.command("info")
		.description("Gets information about a user.")
		.option("--include-locale", "Set this to `true` to receive the locale for this user. Defaults to `false`")
		.option("--user <value>", "User to get info on")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.includeLocale !== undefined) args["include_locale"] = opts.includeLocale;
				if (opts.user !== undefined) args["user"] = opts.user;
				const result = await client.apiCall("users.info", args);
				output(result);
			}),
		);

	group
		.command("list")
		.description("Lists all users in a Slack team.")
		.option(
			"--limit <value>",
			"The maximum number of items to return. Fewer than the requested number of items may be returned, even if the end of the users list hasn't been reached. Providing no `limit` value will result in Slack attempting to deliver you the entire result set. If the collection is too large you may experience `limit_required` or HTTP 500 errors.",
		)
		.option(
			"--cursor <value>",
			'Paginate through collections of data by setting the `cursor` parameter to a `next_cursor` attribute returned by a previous request\'s `response_metadata`. Default value fetches the first "page" of the collection. See [pagination](/docs/pagination) for more detail.',
		)
		.option("--include-locale", "Set this to `true` to receive the locale for users. Defaults to `false`")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.includeLocale !== undefined) args["include_locale"] = opts.includeLocale;
				const result = await client.apiCall("users.list", args);
				output(result);
			}),
		);

	group
		.command("lookupByEmail")
		.description("Find a user with an email address.")
		.requiredOption("--email <value>", "An email address belonging to a user in the workspace")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.email !== undefined) args["email"] = opts.email;
				const result = await client.apiCall("users.lookupByEmail", args);
				output(result);
			}),
		);

	group
		.command("profile-get")
		.description("Retrieves a user's profile information.")
		.option("--include-labels", "Include labels for each ID in custom profile fields")
		.option("--user <value>", "User to retrieve profile info for")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.includeLabels !== undefined) args["include_labels"] = opts.includeLabels;
				if (opts.user !== undefined) args["user"] = opts.user;
				const result = await client.apiCall("users.profile.get", args);
				output(result);
			}),
		);

	group
		.command("profile-set")
		.description("Set the profile information for a user.")
		.option("--name <value>", "Name of a single key to set. Usable only if `profile` is not passed.")
		.option(
			"--profile <value>",
			"Collection of key:value pairs presented as a URL-encoded JSON hash. At most 50 fields may be set. Each field name is limited to 255 characters.",
		)
		.option("--user <value>", "ID of user to change. This argument may only be specified by team admins on paid teams.")
		.option("--value <value>", "Value to set a single key to. Usable only if `profile` is not passed.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.name !== undefined) args["name"] = opts.name;
				if (opts.profile !== undefined) args["profile"] = opts.profile;
				if (opts.user !== undefined) args["user"] = opts.user;
				if (opts.value !== undefined) args["value"] = opts.value;
				const result = await client.apiCall("users.profile.set", args);
				output(result);
			}),
		);

	group
		.command("setActive")
		.description("Marked a user as active. Deprecated and non-functional.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				const result = await client.apiCall("users.setActive", args);
				output(result);
			}),
		);

	group
		.command("setPhoto")
		.description("Set the user profile photo")
		.option("--crop-w <value>", "Width/height of crop box (always square)")
		.option("--crop-x <value>", "X coordinate of top-left corner of crop box")
		.option("--crop-y <value>", "Y coordinate of top-left corner of crop box")
		.option("--image <value>", "File contents via `multipart/form-data`.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.cropW !== undefined) args["crop_w"] = opts.cropW;
				if (opts.cropX !== undefined) args["crop_x"] = opts.cropX;
				if (opts.cropY !== undefined) args["crop_y"] = opts.cropY;
				if (opts.image !== undefined) args["image"] = opts.image;
				const result = await client.apiCall("users.setPhoto", args);
				output(result);
			}),
		);

	group
		.command("setPresence")
		.description("Manually sets user presence.")
		.requiredOption("--presence <value>", "Either `auto` or `away`")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.presence !== undefined) args["presence"] = opts.presence;
				const result = await client.apiCall("users.setPresence", args);
				output(result);
			}),
		);
}
