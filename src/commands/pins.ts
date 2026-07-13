/**
 * Auto-generated from Slack OpenAPI spec — pins.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupPinsCommand(program: Command): void {
	const group = program.command("pins").description("pins.* API methods");

	group
		.command("add")
		.description("Pins an item to a channel.")
		.requiredOption("--channel <value>", "Channel to pin the item in.")
		.option("--timestamp <value>", "Timestamp of the message to pin.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.timestamp !== undefined) args["timestamp"] = opts.timestamp;
				const result = await client.apiCall("pins.add", args);
				output(result);
			}),
		);

	group
		.command("list")
		.description("Lists items pinned to a channel.")
		.requiredOption("--channel <value>", "Channel to get pinned items for.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				const result = await client.apiCall("pins.list", args);
				output(result);
			}),
		);

	group
		.command("remove")
		.description("Un-pins an item from a channel.")
		.requiredOption("--channel <value>", "Channel where the item is pinned to.")
		.option("--timestamp <value>", "Timestamp of the message to un-pin.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.timestamp !== undefined) args["timestamp"] = opts.timestamp;
				const result = await client.apiCall("pins.remove", args);
				output(result);
			}),
		);
}
