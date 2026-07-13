/**
 * SDK-only Slack methods — functions.* methods
 * Not in OpenAPI spec; uses client.apiCall() directly.
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupFunctionsCommand(program: Command): void {
	const group = program.command("functions").description("functions.* API methods");

	group
		.command("completeError")
		.description("Signal that a function execution encountered an error.")
		.requiredOption("--function-execution-id <value>", "The ID of the function execution to report an error for.")
		.requiredOption("--error <value>", "Error message describing what went wrong.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.functionExecutionId !== undefined) args["function_execution_id"] = opts.functionExecutionId;
				if (opts.error !== undefined) args["error"] = opts.error;
				const result = await client.apiCall("functions.completeError", args);
				output(result);
			}),
		);

	group
		.command("completeSuccess")
		.description("Signal that a function execution completed successfully.")
		.requiredOption("--function-execution-id <value>", "The ID of the function execution to report success for.")
		.requiredOption("--outputs <value>", "JSON object containing the function output values.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.functionExecutionId !== undefined) args["function_execution_id"] = opts.functionExecutionId;
				if (opts.outputs !== undefined) args["outputs"] = opts.outputs;
				const result = await client.apiCall("functions.completeSuccess", args);
				output(result);
			}),
		);
}
