import { createAnthropic } from "@ai-sdk/anthropic";
import { stepCountIs, ToolLoopAgent } from "ai";
import { buildSystemPrompt } from "./system-prompt";
import { buildTools } from "./tools";

const anthropic = createAnthropic();

const DEFAULT_MODEL = "claude-sonnet-5";

function maxSteps(): number {
	const parsed = Number.parseInt(process.env.MAX_STEPS ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 && parsed <= 50 ? parsed : 15;
}

/**
 * The Slack agent loop. Model and behavior are env-driven:
 *   ANTHROPIC_API_KEY — required
 *   BOT_MODEL — model id (default claude-sonnet-5)
 *   MAX_STEPS — tool-loop cap (default 15)
 */
export const agent = new ToolLoopAgent({
	model: anthropic(process.env.BOT_MODEL?.trim() || DEFAULT_MODEL),
	instructions: {
		role: "system",
		content: buildSystemPrompt(),
		providerOptions: {
			anthropic: { cacheControl: { type: "ephemeral" } },
		},
	},
	tools: buildTools(),
	stopWhen: stepCountIs(maxSteps()),
});
