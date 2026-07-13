#!/usr/bin/env node

/**
 * @elnora-ai/slack — Complete Slack Web API from the command line.
 *
 * Every public endpoint. Agent-friendly JSON output. Zero config.
 *
 * Auth: set SLACK_TOKEN, SLACK_BOT_TOKEN, or SLACK_USER_TOKEN (or write them to
 *       ~/.config/elnora-slack/.env).
 * Debug: set SLACK_CLI_DEBUG=1 for stack traces and verbose SDK logging.
 */

import { classifySlackError, EXIT_CODES, SlackCliError } from "./errors.js";
import { redactSecrets } from "./security.js";

process.on("unhandledRejection", (reason: unknown) => {
	const classified = classifySlackError(reason);
	const payload: Record<string, unknown> = {
		error: redactSecrets(classified.message),
		code: classified.code,
		type: "unhandledRejection",
	};
	if (process.env.SLACK_CLI_DEBUG && reason instanceof Error && reason.stack) {
		payload.stack = redactSecrets(reason.stack);
	}
	console.error(JSON.stringify(payload));
	process.exit(classified.exitCode);
});

process.on("uncaughtException", (error: Error) => {
	const classified = classifySlackError(error);
	const payload: Record<string, unknown> = {
		error: redactSecrets(classified.message),
		code: classified.code,
		type: "uncaughtException",
	};
	if (process.env.SLACK_CLI_DEBUG && error.stack) {
		payload.stack = redactSecrets(error.stack);
	}
	console.error(JSON.stringify(payload));
	process.exit(classified.exitCode);
});

import { createRequire } from "node:module";
import { Command } from "commander";
import { registerAllCommands } from "./commands/index.js";
import { outputError, setCompactMode, setFields, setOutputFormat } from "./output.js";

const program = new Command();

program
	.name("elnora-slack")
	.description("Complete Slack Web API CLI — every endpoint, agent-friendly JSON output")
	.version(createRequire(import.meta.url)("../package.json").version);

// Register all command groups + completion
registerAllCommands(program);

// Global options
program.option("--compact", "Compact JSON output (saves tokens)");
program.option("--output <format>", "Output format: json (default), table, csv");
program.option("--fields <list>", "Comma-separated fields to include");
program.hook("preAction", (thisCommand) => {
	try {
		const opts = thisCommand.optsWithGlobals();
		if (opts.compact) setCompactMode(true);
		if (opts.output) setOutputFormat(opts.output);
		if (opts.fields) setFields(opts.fields);
	} catch (error) {
		outputError(error);
		const exitCode = error instanceof SlackCliError ? error.exitCode : EXIT_CODES.GENERIC;
		process.exit(exitCode);
	}
});

program.parse();
