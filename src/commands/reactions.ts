/**
 * Auto-generated from Slack OpenAPI spec — reactions.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupReactionsCommand(program: Command): void {
	const group = program.command("reactions").description("reactions.* API methods");

	group
		.command("add")
		.description("Adds a reaction to an item.")
		.requiredOption("--channel <value>", "Channel where the message to add reaction to was posted.")
		.requiredOption("--name <value>", "Reaction (emoji) name.")
		.requiredOption("--timestamp <value>", "Timestamp of the message to add reaction to.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.name !== undefined) args["name"] = opts.name;
				if (opts.timestamp !== undefined) args["timestamp"] = opts.timestamp;
				const result = await client.apiCall("reactions.add", args);
				output(result);
			}),
		);

	group
		.command("get")
		.description("Gets reactions for an item.")
		.option("--channel <value>", "Channel where the message to get reactions for was posted.")
		.option("--file <value>", "File to get reactions for.")
		.option("--file-comment <value>", "File comment to get reactions for.")
		.option("--full", "If true always return the complete reaction list.")
		.option("--timestamp <value>", "Timestamp of the message to get reactions for.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.fileComment !== undefined) args["file_comment"] = opts.fileComment;
				if (opts.full !== undefined) args["full"] = opts.full;
				if (opts.timestamp !== undefined) args["timestamp"] = opts.timestamp;
				const result = await client.apiCall("reactions.get", args);
				output(result);
			}),
		);

	group
		.command("list")
		.description("Lists reactions made by a user.")
		.option("--user <value>", "Show reactions made by this user. Defaults to the authed user.")
		.option("--full", "If true always return the complete reaction list.")
		.option("--count <value>", "count")
		.option("--page <value>", "page")
		.option(
			"--cursor <value>",
			'Parameter for pagination. Set `cursor` equal to the `next_cursor` attribute returned by the previous request\'s `response_metadata`. This parameter is optional, but pagination is mandatory: the default value simply fetches the first "page" of the collection. See [pagination](/docs/pagination) for more details.',
		)
		.option(
			"--limit <value>",
			"The maximum number of items to return. Fewer than the requested number of items may be returned, even if the end of the list hasn't been reached.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.user !== undefined) args["user"] = opts.user;
				if (opts.full !== undefined) args["full"] = opts.full;
				if (opts.count !== undefined) args["count"] = opts.count;
				if (opts.page !== undefined) args["page"] = opts.page;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("reactions.list", args);
				output(result);
			}),
		);

	group
		.command("remove")
		.description("Removes a reaction from an item.")
		.requiredOption("--name <value>", "Reaction (emoji) name.")
		.option("--file <value>", "File to remove reaction from.")
		.option("--file-comment <value>", "File comment to remove reaction from.")
		.option("--channel <value>", "Channel where the message to remove reaction from was posted.")
		.option("--timestamp <value>", "Timestamp of the message to remove reaction from.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.name !== undefined) args["name"] = opts.name;
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.fileComment !== undefined) args["file_comment"] = opts.fileComment;
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.timestamp !== undefined) args["timestamp"] = opts.timestamp;
				const result = await client.apiCall("reactions.remove", args);
				output(result);
			}),
		);
}
