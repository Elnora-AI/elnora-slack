import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { type LanguageModel, stepCountIs, ToolLoopAgent } from "ai";
import { buildSystemPrompt } from "./system-prompt";
import { buildTools } from "./tools";

/**
 * Pick the LLM provider from the environment so any brain can drive the bot:
 *
 *   LLM_PROVIDER = anthropic | openai | google   (default: anthropic)
 *   BOT_MODEL    = model id override               (provider default otherwise)
 *
 * API keys are the provider SDK defaults:
 *   anthropic → ANTHROPIC_API_KEY
 *   openai    → OPENAI_API_KEY
 *   google    → GOOGLE_GENERATIVE_AI_API_KEY
 */
const DEFAULT_MODEL: Record<string, string> = {
	anthropic: "claude-sonnet-5",
	openai: "gpt-5",
	google: "gemini-2.5-pro",
};

function resolveModel(): LanguageModel {
	const provider = (process.env.LLM_PROVIDER?.trim() || "anthropic").toLowerCase();
	const modelId = process.env.BOT_MODEL?.trim();
	switch (provider) {
		case "openai":
			return createOpenAI()(modelId || DEFAULT_MODEL.openai);
		case "google":
		case "gemini":
			return createGoogleGenerativeAI()(modelId || DEFAULT_MODEL.google);
		default:
			return createAnthropic()(modelId || DEFAULT_MODEL.anthropic);
	}
}

function maxSteps(): number {
	const parsed = Number.parseInt(process.env.MAX_STEPS ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 && parsed <= 50 ? parsed : 15;
}

/**
 * The Slack agent loop. Model and behavior are env-driven:
 *   LLM_PROVIDER — anthropic | openai | google (default anthropic)
 *   BOT_MODEL — model id (provider default otherwise)
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
