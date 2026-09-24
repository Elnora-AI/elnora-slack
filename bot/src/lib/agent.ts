import { stepCountIs, ToolLoopAgent } from "ai";
import { resolveModel } from "./llm-provider";
import { buildSystemPrompt } from "./system-prompt";
import { buildTools } from "./tools";

function maxSteps(): number {
	const parsed = Number.parseInt(process.env.MAX_STEPS ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 && parsed <= 50 ? parsed : 15;
}

/**
 * The Slack agent loop. Model and behavior are env-driven:
 *   LLM_PROVIDER / BOT_MODEL / any provider key — see llm-provider.ts
 *   MAX_STEPS — tool-loop cap (default 15)
 */
export const agent = new ToolLoopAgent({
	model: resolveModel(),
	instructions: {
		role: "system",
		content: buildSystemPrompt(),
	},
	tools: buildTools(),
	stopWhen: stepCountIs(maxSteps()),
});
