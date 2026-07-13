/**
 * Auto-generated from Slack OpenAPI spec — stars.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupStarsCommand(program: Command): void {
	const group = program.command("stars").description("stars.* API methods");

	group
		.command("add")
		.description("Adds a star to an item.")
		.option(
			"--channel <value>",
			"Channel to add star to, or channel where the message to add star to was posted (used with `timestamp`).",
		)
		.option("--file <value>", "File to add star to.")
		.option("--file-comment <value>", "File comment to add star to.")
		.option("--timestamp <value>", "Timestamp of the message to add star to.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.fileComment !== undefined) args["file_comment"] = opts.fileComment;
				if (opts.timestamp !== undefined) args["timestamp"] = opts.timestamp;
				const result = await client.apiCall("stars.add", args);
				output(result);
			}),
		);

	group
		.command("list")
		.description("Lists stars for a user.")
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
				if (opts.count !== undefined) args["count"] = opts.count;
				if (opts.page !== undefined) args["page"] = opts.page;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("stars.list", args);
				output(result);
			}),
		);

	group
		.command("remove")
		.description("Removes a star from an item.")
		.option(
			"--channel <value>",
			"Channel to remove star from, or channel where the message to remove star from was posted (used with `timestamp`).",
		)
		.option("--file <value>", "File to remove star from.")
		.option("--file-comment <value>", "File comment to remove star from.")
		.option("--timestamp <value>", "Timestamp of the message to remove star from.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.fileComment !== undefined) args["file_comment"] = opts.fileComment;
				if (opts.timestamp !== undefined) args["timestamp"] = opts.timestamp;
				const result = await client.apiCall("stars.remove", args);
				output(result);
			}),
		);
}
