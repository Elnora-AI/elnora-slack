/**
 * Auto-generated from Slack OpenAPI spec — oauth.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupOauthCommand(program: Command): void {
	const group = program.command("oauth").description("oauth.* API methods");

	group
		.command("access")
		.description("Exchanges a temporary OAuth verifier code for an access token.")
		.option("--client-id <value>", "Issued when you created your application.")
		.option("--client-secret <value>", "Issued when you created your application. (or set SLACK_CLIENT_SECRET env var)")
		.option("--code <value>", "The `code` param returned via the OAuth callback.")
		.option("--redirect-uri <value>", "This must match the originally submitted URI (if one was sent).")
		.option(
			"--single-channel",
			"Request the user to add your app only to a single channel. Only valid with a [legacy workspace app](https://api.slack.com/legacy-workspace-apps).",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.clientId !== undefined) args["client_id"] = opts.clientId;
				args["client_secret"] = opts.clientSecret ?? process.env.SLACK_CLIENT_SECRET;
				if (opts.code !== undefined) args["code"] = opts.code;
				if (opts.redirectUri !== undefined) args["redirect_uri"] = opts.redirectUri;
				if (opts.singleChannel !== undefined) args["single_channel"] = opts.singleChannel;
				const result = await client.apiCall("oauth.access", args);
				output(result);
			}),
		);

	group
		.command("token")
		.description("Exchanges a temporary OAuth verifier code for a workspace token.")
		.option("--client-id <value>", "Issued when you created your application.")
		.option("--client-secret <value>", "Issued when you created your application. (or set SLACK_CLIENT_SECRET env var)")
		.option("--code <value>", "The `code` param returned via the OAuth callback.")
		.option("--redirect-uri <value>", "This must match the originally submitted URI (if one was sent).")
		.option("--single-channel", "Request the user to add your app only to a single channel.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.clientId !== undefined) args["client_id"] = opts.clientId;
				args["client_secret"] = opts.clientSecret ?? process.env.SLACK_CLIENT_SECRET;
				if (opts.code !== undefined) args["code"] = opts.code;
				if (opts.redirectUri !== undefined) args["redirect_uri"] = opts.redirectUri;
				if (opts.singleChannel !== undefined) args["single_channel"] = opts.singleChannel;
				const result = await client.apiCall("oauth.token", args);
				output(result);
			}),
		);

	group
		.command("v2-access")
		.description("Exchanges a temporary OAuth verifier code for an access token.")
		.option("--client-id <value>", "Issued when you created your application.")
		.option("--client-secret <value>", "Issued when you created your application. (or set SLACK_CLIENT_SECRET env var)")
		.requiredOption("--code <value>", "The `code` param returned via the OAuth callback.")
		.option("--redirect-uri <value>", "This must match the originally submitted URI (if one was sent).")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.clientId !== undefined) args["client_id"] = opts.clientId;
				args["client_secret"] = opts.clientSecret ?? process.env.SLACK_CLIENT_SECRET;
				if (opts.code !== undefined) args["code"] = opts.code;
				if (opts.redirectUri !== undefined) args["redirect_uri"] = opts.redirectUri;
				const result = await client.apiCall("oauth.v2.access", args);
				output(result);
			}),
		);
}
