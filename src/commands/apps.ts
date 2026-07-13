/**
 * Auto-generated from Slack OpenAPI spec — apps.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupAppsCommand(program: Command): void {
	const group = program.command("apps").description("apps.* API methods");

	group
		.command("event-authorizations-list")
		.description(
			"Get a list of authorizations for the given event context. Each authorization represents an app installation that the event is visible to.",
		)
		.requiredOption("--event-context <value>", "event_context")
		.option("--cursor <value>", "cursor")
		.option("--limit <value>", "limit")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.eventContext !== undefined) args["event_context"] = opts.eventContext;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("apps.event.authorizations.list", args);
				output(result);
			}),
		);

	group
		.command("permissions-info")
		.description("Returns list of permissions this app has on a team.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				const result = await client.apiCall("apps.permissions.info", args);
				output(result);
			}),
		);

	group
		.command("permissions-request")
		.description("Allows an app to request additional scopes")
		.requiredOption("--scopes <value>", "A comma separated list of scopes to request for")
		.requiredOption("--trigger-id <value>", "Token used to trigger the permissions API")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.scopes !== undefined) args["scopes"] = opts.scopes;
				if (opts.triggerId !== undefined) args["trigger_id"] = opts.triggerId;
				const result = await client.apiCall("apps.permissions.request", args);
				output(result);
			}),
		);

	group
		.command("permissions-resources-list")
		.description("Returns list of resource grants this app has on a team.")
		.option(
			"--cursor <value>",
			'Paginate through collections of data by setting the `cursor` parameter to a `next_cursor` attribute returned by a previous request\'s `response_metadata`. Default value fetches the first "page" of the collection. See [pagination](/docs/pagination) for more detail.',
		)
		.option("--limit <value>", "The maximum number of items to return.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("apps.permissions.resources.list", args);
				output(result);
			}),
		);

	group
		.command("permissions-scopes-list")
		.description("Returns list of scopes this app has on a team.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				const result = await client.apiCall("apps.permissions.scopes.list", args);
				output(result);
			}),
		);

	group
		.command("permissions-users-list")
		.description("Returns list of user grants and corresponding scopes this app has on a team.")
		.option(
			"--cursor <value>",
			'Paginate through collections of data by setting the `cursor` parameter to a `next_cursor` attribute returned by a previous request\'s `response_metadata`. Default value fetches the first "page" of the collection. See [pagination](/docs/pagination) for more detail.',
		)
		.option("--limit <value>", "The maximum number of items to return.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("apps.permissions.users.list", args);
				output(result);
			}),
		);

	group
		.command("permissions-users-request")
		.description("Enables an app to trigger a permissions modal to grant an app access to a user access scope.")
		.requiredOption("--scopes <value>", "A comma separated list of user scopes to request for")
		.requiredOption("--trigger-id <value>", "Token used to trigger the request")
		.requiredOption("--user <value>", "The user this scope is being requested for")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.scopes !== undefined) args["scopes"] = opts.scopes;
				if (opts.triggerId !== undefined) args["trigger_id"] = opts.triggerId;
				if (opts.user !== undefined) args["user"] = opts.user;
				const result = await client.apiCall("apps.permissions.users.request", args);
				output(result);
			}),
		);

	group
		.command("uninstall")
		.description("Uninstalls your app from a workspace.")
		.option("--client-id <value>", "Issued when you created your application.")
		.option("--client-secret <value>", "Issued when you created your application. (or set SLACK_CLIENT_SECRET env var)")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.clientId !== undefined) args["client_id"] = opts.clientId;
				args["client_secret"] = opts.clientSecret ?? process.env.SLACK_CLIENT_SECRET;
				const result = await client.apiCall("apps.uninstall", args);
				output(result);
			}),
		);
}
