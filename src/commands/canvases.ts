/**
 * SDK-only Slack methods — canvases.* methods
 * Not in OpenAPI spec; uses client.apiCall() directly.
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupCanvasesCommand(program: Command): void {
	const group = program.command("canvases").description("canvases.* API methods");

	group
		.command("access-delete")
		.description("Remove access to a canvas for specified users or channels.")
		.requiredOption("--canvas-id <value>", "ID of the canvas to remove access from.")
		.option("--channel-ids <value>", "JSON array of channel IDs to remove access for.")
		.option("--user-ids <value>", "JSON array of user IDs to remove access for.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.canvasId !== undefined) args["canvas_id"] = opts.canvasId;
				if (opts.channelIds !== undefined) args["channel_ids"] = opts.channelIds;
				if (opts.userIds !== undefined) args["user_ids"] = opts.userIds;
				const result = await client.apiCall("canvases.access.delete", args);
				output(result);
			}),
		);

	group
		.command("access-set")
		.description("Set access level for a canvas for specified users or channels.")
		.requiredOption("--canvas-id <value>", "ID of the canvas to set access on.")
		.requiredOption("--access-level <value>", "Access level to grant (e.g. read, write).")
		.option("--channel-ids <value>", "JSON array of channel IDs to set access for.")
		.option("--user-ids <value>", "JSON array of user IDs to set access for.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.canvasId !== undefined) args["canvas_id"] = opts.canvasId;
				if (opts.accessLevel !== undefined) args["access_level"] = opts.accessLevel;
				if (opts.channelIds !== undefined) args["channel_ids"] = opts.channelIds;
				if (opts.userIds !== undefined) args["user_ids"] = opts.userIds;
				const result = await client.apiCall("canvases.access.set", args);
				output(result);
			}),
		);

	group
		.command("create")
		.description("Create a new canvas.")
		.option("--title <value>", "Title of the canvas.")
		.option("--document-content <value>", "JSON structure with the document content for the canvas.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.title !== undefined) args["title"] = opts.title;
				if (opts.documentContent !== undefined) args["document_content"] = opts.documentContent;
				const result = await client.apiCall("canvases.create", args);
				output(result);
			}),
		);

	group
		.command("delete")
		.description("Delete an existing canvas.")
		.requiredOption("--canvas-id <value>", "ID of the canvas to delete.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.canvasId !== undefined) args["canvas_id"] = opts.canvasId;
				const result = await client.apiCall("canvases.delete", args);
				output(result);
			}),
		);

	group
		.command("edit")
		.description("Edit an existing canvas.")
		.requiredOption("--canvas-id <value>", "ID of the canvas to edit.")
		.requiredOption("--changes <value>", "JSON array of changes to apply to the canvas.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.canvasId !== undefined) args["canvas_id"] = opts.canvasId;
				if (opts.changes !== undefined) args["changes"] = opts.changes;
				const result = await client.apiCall("canvases.edit", args);
				output(result);
			}),
		);

	group
		.command("sections-lookup")
		.description("Lookup sections in a canvas.")
		.requiredOption("--canvas-id <value>", "ID of the canvas to look up sections in.")
		.requiredOption("--criteria <value>", "JSON criteria for looking up sections.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.canvasId !== undefined) args["canvas_id"] = opts.canvasId;
				if (opts.criteria !== undefined) args["criteria"] = opts.criteria;
				const result = await client.apiCall("canvases.sections.lookup", args);
				output(result);
			}),
		);
}
