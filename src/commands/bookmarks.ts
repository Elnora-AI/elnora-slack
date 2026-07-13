/**
 * SDK-only Slack methods — bookmarks.* methods
 * Not in OpenAPI spec; uses client.apiCall() directly.
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupBookmarksCommand(program: Command): void {
	const group = program.command("bookmarks").description("bookmarks.* API methods");

	group
		.command("add")
		.description("Add a bookmark to a channel.")
		.requiredOption("--channel-id <value>", "Channel to add the bookmark to.")
		.requiredOption("--title <value>", "Title for the bookmark.")
		.requiredOption("--type <value>", "Type of the bookmark (e.g. link).")
		.option("--emoji <value>", "Emoji tag to apply to the bookmark.")
		.option("--entity-id <value>", "ID of the entity being bookmarked (for non-link types).")
		.option("--link <value>", "Link to bookmark.")
		.option("--parent-id <value>", "ID of the parent bookmark folder.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				if (opts.title !== undefined) args["title"] = opts.title;
				if (opts.type !== undefined) args["type"] = opts.type;
				if (opts.emoji !== undefined) args["emoji"] = opts.emoji;
				if (opts.entityId !== undefined) args["entity_id"] = opts.entityId;
				if (opts.link !== undefined) args["link"] = opts.link;
				if (opts.parentId !== undefined) args["parent_id"] = opts.parentId;
				const result = await client.apiCall("bookmarks.add", args);
				output(result);
			}),
		);

	group
		.command("edit")
		.description("Edit an existing bookmark.")
		.requiredOption("--bookmark-id <value>", "Bookmark to update.")
		.requiredOption("--channel-id <value>", "Channel containing the bookmark.")
		.option("--emoji <value>", "Emoji tag to apply to the bookmark.")
		.option("--link <value>", "Link for the bookmark.")
		.option("--title <value>", "Title for the bookmark.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.bookmarkId !== undefined) args["bookmark_id"] = opts.bookmarkId;
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				if (opts.emoji !== undefined) args["emoji"] = opts.emoji;
				if (opts.link !== undefined) args["link"] = opts.link;
				if (opts.title !== undefined) args["title"] = opts.title;
				const result = await client.apiCall("bookmarks.edit", args);
				output(result);
			}),
		);

	group
		.command("list")
		.description("List bookmarks for a channel.")
		.requiredOption("--channel-id <value>", "Channel to list bookmarks for.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				const result = await client.apiCall("bookmarks.list", args);
				output(result);
			}),
		);

	group
		.command("remove")
		.description("Remove a bookmark from a channel.")
		.requiredOption("--bookmark-id <value>", "Bookmark to remove.")
		.requiredOption("--channel-id <value>", "Channel containing the bookmark.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.bookmarkId !== undefined) args["bookmark_id"] = opts.bookmarkId;
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				const result = await client.apiCall("bookmarks.remove", args);
				output(result);
			}),
		);
}
