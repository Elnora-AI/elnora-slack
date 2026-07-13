/**
 * Auto-generated from Slack OpenAPI spec — search.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupSearchCommand(program: Command): void {
	const group = program.command("search").description("search.* API methods");

	group
		.command("messages")
		.description("Searches for messages matching a query.")
		.option("--count <value>", 'Pass the number of results you want per "page". Maximum of `100`.')
		.option("--highlight", "Pass a value of `true` to enable query highlight markers (see below).")
		.option("--page <value>", "page")
		.requiredOption("--query <value>", "Search query.")
		.option("--sort <value>", "Return matches sorted by either `score` or `timestamp`.")
		.option("--sort-dir <value>", "Change sort direction to ascending (`asc`) or descending (`desc`).")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient({ requireUserToken: true });
				const args: Record<string, unknown> = {};
				if (opts.count !== undefined) args["count"] = opts.count;
				if (opts.highlight !== undefined) args["highlight"] = opts.highlight;
				if (opts.page !== undefined) args["page"] = opts.page;
				if (opts.query !== undefined) args["query"] = opts.query;
				if (opts.sort !== undefined) args["sort"] = opts.sort;
				if (opts.sortDir !== undefined) args["sort_dir"] = opts.sortDir;
				const result = await client.apiCall("search.messages", args);
				output(result);
			}),
		);
}
