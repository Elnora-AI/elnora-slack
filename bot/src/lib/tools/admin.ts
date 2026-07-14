import { tool } from "ai";
import { z } from "zod";

export const help = tool({
	description:
		"Show available capabilities and how to use the agent. Use when the user says 'help' or asks what you can do.",
	inputSchema: z.object({}),
	execute: async () => {
		// Import lazily to avoid a module cycle (tools/index imports this file).
		const { toolGroups } = await import("./index");
		return {
			capabilities: toolGroups()
				.filter((g) => g.enabled)
				.map((g) => `**${g.label}**: ${g.promptHint}`),
			usage: [
				"DM me directly, or @-mention me in any channel — I reply in a thread and remember the conversation.",
				"I can be restricted to specific users via ALLOWED_SLACK_USER_IDS; by default everyone in this workspace can talk to me.",
			],
		};
	},
});

export const systemStatus = tool({
	description: "Check the status of connected services. Use when asked about health or connectivity.",
	inputSchema: z.object({}),
	execute: async () => {
		const checks: Record<string, "ok" | "not configured"> = {};

		// Only report configured/not — never reveal specifics about keys or infrastructure
		checks.knowledgeBase = process.env.DRIVE_ID ? "ok" : "not configured";
		checks.linear = process.env.LINEAR_API_KEY ? "ok" : "not configured";
		checks.gmail = process.env.GOOGLE_REFRESH_TOKEN ? "ok" : "not configured";
		checks.calendar = process.env.GOOGLE_REFRESH_TOKEN ? "ok" : "not configured";
		checks.slackSearch = process.env.SLACK_USER_TOKEN ? "ok" : "not configured";
		checks.webSearchTavily = process.env.TAVILY_API_KEY ? "ok" : "not configured";
		checks.exa = process.env.EXA_API_KEY ? "ok" : "not configured";
		checks.perplexity = process.env.PERPLEXITY_API_KEY ? "ok" : "not configured";
		checks.valyu = process.env.VALYU_API_KEY ? "ok" : "not configured";
		checks.conversationMemory = process.env.REDIS_URL ? "ok" : "not configured";

		return { services: checks };
	},
});
