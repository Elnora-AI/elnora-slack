/**
 * SDK-only Slack methods — lists.* methods
 * Not in OpenAPI spec; uses client.apiCall() directly.
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupSlackListsCommand(program: Command): void {
	const group = program.command("lists").description("lists.* API methods");

	group
		.command("create")
		.description("Create a new list.")
		.requiredOption("--title <value>", "Title of the list.")
		.option("--description <value>", "Description of the list.")
		.option("--external-id <value>", "External ID for the list.")
		.option("--columns <value>", "JSON array of column definitions for the list.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.title !== undefined) args["title"] = opts.title;
				if (opts.description !== undefined) args["description"] = opts.description;
				if (opts.externalId !== undefined) args["external_id"] = opts.externalId;
				if (opts.columns !== undefined) args["columns"] = opts.columns;
				const result = await client.apiCall("lists.create", args);
				output(result);
			}),
		);

	group
		.command("delete")
		.description("Delete a list.")
		.requiredOption("--list-id <value>", "ID of the list to delete.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				const result = await client.apiCall("lists.delete", args);
				output(result);
			}),
		);

	group
		.command("update")
		.description("Update a list.")
		.requiredOption("--list-id <value>", "ID of the list to update.")
		.option("--title <value>", "New title for the list.")
		.option("--description <value>", "New description for the list.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.title !== undefined) args["title"] = opts.title;
				if (opts.description !== undefined) args["description"] = opts.description;
				const result = await client.apiCall("lists.update", args);
				output(result);
			}),
		);

	group
		.command("columns-create")
		.description("Create a column in a list.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--name <value>", "Name of the column.")
		.requiredOption("--type <value>", "Type of the column.")
		.option("--options <value>", "JSON object with column options.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.name !== undefined) args["name"] = opts.name;
				if (opts.type !== undefined) args["type"] = opts.type;
				if (opts.options !== undefined) args["options"] = opts.options;
				const result = await client.apiCall("lists.columns.create", args);
				output(result);
			}),
		);

	group
		.command("columns-delete")
		.description("Delete a column from a list.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--column-id <value>", "ID of the column to delete.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.columnId !== undefined) args["column_id"] = opts.columnId;
				const result = await client.apiCall("lists.columns.delete", args);
				output(result);
			}),
		);

	group
		.command("columns-update")
		.description("Update a column in a list.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--column-id <value>", "ID of the column to update.")
		.option("--name <value>", "New name for the column.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.columnId !== undefined) args["column_id"] = opts.columnId;
				if (opts.name !== undefined) args["name"] = opts.name;
				const result = await client.apiCall("lists.columns.update", args);
				output(result);
			}),
		);

	group
		.command("item-create")
		.description("Create an item in a list.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.option("--column-values <value>", "JSON object mapping column IDs to values.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.columnValues !== undefined) args["column_values"] = opts.columnValues;
				const result = await client.apiCall("lists.item.create", args);
				output(result);
			}),
		);

	group
		.command("item-delete")
		.description("Delete an item from a list.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--item-id <value>", "ID of the item to delete.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.itemId !== undefined) args["item_id"] = opts.itemId;
				const result = await client.apiCall("lists.item.delete", args);
				output(result);
			}),
		);

	group
		.command("item-get")
		.description("Get an item from a list.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--item-id <value>", "ID of the item to retrieve.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.itemId !== undefined) args["item_id"] = opts.itemId;
				const result = await client.apiCall("lists.item.get", args);
				output(result);
			}),
		);

	group
		.command("item-update")
		.description("Update an item in a list.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--item-id <value>", "ID of the item to update.")
		.option("--column-values <value>", "JSON object mapping column IDs to new values.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.itemId !== undefined) args["item_id"] = opts.itemId;
				if (opts.columnValues !== undefined) args["column_values"] = opts.columnValues;
				const result = await client.apiCall("lists.item.update", args);
				output(result);
			}),
		);

	group
		.command("addItemAttachment")
		.description("Add an attachment to a list item.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--item-id <value>", "ID of the item.")
		.requiredOption("--column-id <value>", "ID of the column to attach to.")
		.requiredOption("--url <value>", "URL of the attachment.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.itemId !== undefined) args["item_id"] = opts.itemId;
				if (opts.columnId !== undefined) args["column_id"] = opts.columnId;
				if (opts.url !== undefined) args["url"] = opts.url;
				const result = await client.apiCall("lists.addItemAttachment", args);
				output(result);
			}),
		);

	group
		.command("addItemColumn")
		.description("Add a column value to a list item.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--item-id <value>", "ID of the item.")
		.requiredOption("--column-id <value>", "ID of the column.")
		.requiredOption("--value <value>", "Value to set for the column.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.itemId !== undefined) args["item_id"] = opts.itemId;
				if (opts.columnId !== undefined) args["column_id"] = opts.columnId;
				if (opts.value !== undefined) args["value"] = opts.value;
				const result = await client.apiCall("lists.addItemColumn", args);
				output(result);
			}),
		);

	group
		.command("addItemComment")
		.description("Add a comment to a list item.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--item-id <value>", "ID of the item.")
		.requiredOption("--text <value>", "Text content of the comment.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.itemId !== undefined) args["item_id"] = opts.itemId;
				if (opts.text !== undefined) args["text"] = opts.text;
				const result = await client.apiCall("lists.addItemComment", args);
				output(result);
			}),
		);

	group
		.command("deleteItemAttachment")
		.description("Delete an attachment from a list item.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--item-id <value>", "ID of the item.")
		.requiredOption("--attachment-id <value>", "ID of the attachment to delete.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.itemId !== undefined) args["item_id"] = opts.itemId;
				if (opts.attachmentId !== undefined) args["attachment_id"] = opts.attachmentId;
				const result = await client.apiCall("lists.deleteItemAttachment", args);
				output(result);
			}),
		);

	group
		.command("getItemComment")
		.description("Get a comment on a list item.")
		.requiredOption("--list-id <value>", "ID of the list.")
		.requiredOption("--item-id <value>", "ID of the item.")
		.requiredOption("--comment-id <value>", "ID of the comment to retrieve.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.listId !== undefined) args["list_id"] = opts.listId;
				if (opts.itemId !== undefined) args["item_id"] = opts.itemId;
				if (opts.commentId !== undefined) args["comment_id"] = opts.commentId;
				const result = await client.apiCall("lists.getItemComment", args);
				output(result);
			}),
		);
}
