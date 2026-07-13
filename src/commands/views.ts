/**
 * Auto-generated from Slack OpenAPI spec — views.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupViewsCommand(program: Command): void {
	const group = program.command("views").description("views.* API methods");

	group
		.command("open")
		.description("Open a view for a user.")
		.requiredOption("--trigger-id <value>", "Exchange a trigger to post to the user.")
		.requiredOption(
			"--view <value>",
			"A [view payload](/reference/surfaces/views). This must be a JSON-encoded string.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.triggerId !== undefined) args["trigger_id"] = opts.triggerId;
				if (opts.view !== undefined) args["view"] = opts.view;
				const result = await client.apiCall("views.open", args);
				output(result);
			}),
		);

	group
		.command("publish")
		.description("Publish a static view for a User.")
		.requiredOption("--user-id <value>", "`id` of the user you want publish a view to.")
		.requiredOption(
			"--view <value>",
			"A [view payload](/reference/surfaces/views). This must be a JSON-encoded string.",
		)
		.option("--hash <value>", "A string that represents view state to protect against possible race conditions.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.userId !== undefined) args["user_id"] = opts.userId;
				if (opts.view !== undefined) args["view"] = opts.view;
				if (opts.hash !== undefined) args["hash"] = opts.hash;
				const result = await client.apiCall("views.publish", args);
				output(result);
			}),
		);

	group
		.command("push")
		.description("Push a view onto the stack of a root view.")
		.requiredOption("--trigger-id <value>", "Exchange a trigger to post to the user.")
		.requiredOption(
			"--view <value>",
			"A [view payload](/reference/surfaces/views). This must be a JSON-encoded string.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.triggerId !== undefined) args["trigger_id"] = opts.triggerId;
				if (opts.view !== undefined) args["view"] = opts.view;
				const result = await client.apiCall("views.push", args);
				output(result);
			}),
		);

	group
		.command("update")
		.description("Update an existing view.")
		.option(
			"--view-id <value>",
			"A unique identifier of the view to be updated. Either `view_id` or `external_id` is required.",
		)
		.option(
			"--external-id <value>",
			"A unique identifier of the view set by the developer. Must be unique for all views on a team. Max length of 255 characters. Either `view_id` or `external_id` is required.",
		)
		.option("--view <value>", "A [view object](/reference/surfaces/views). This must be a JSON-encoded string.")
		.option("--hash <value>", "A string that represents view state to protect against possible race conditions.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.viewId !== undefined) args["view_id"] = opts.viewId;
				if (opts.externalId !== undefined) args["external_id"] = opts.externalId;
				if (opts.view !== undefined) args["view"] = opts.view;
				if (opts.hash !== undefined) args["hash"] = opts.hash;
				const result = await client.apiCall("views.update", args);
				output(result);
			}),
		);
}
