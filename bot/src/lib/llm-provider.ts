import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Any LLM key drives the bot. The provider is picked in this order:
 *
 *   1. LLM_PROVIDER, when set (anthropic | openai | google | openrouter | groq |
 *      deepseek | xai | mistral | custom)
 *   2. LLM_BASE_URL, when set → custom: any OpenAI-compatible endpoint (Azure
 *      OpenAI, Together, Fireworks, LiteLLM, a self-hosted vLLM/Ollama, …) with
 *      LLM_API_KEY and BOT_MODEL
 *   3. the first provider below whose API key is set
 *
 * BOT_MODEL overrides the provider's default model.
 */
interface Provider {
	/** Env vars that may hold the key; the first one set wins. */
	keys: string[];
	model: string;
	/** OpenAI-compatible endpoint. Absent = the provider's native SDK. */
	baseURL?: string;
}

export const PROVIDERS: Record<string, Provider> = {
	anthropic: { keys: ["ANTHROPIC_API_KEY"], model: "claude-sonnet-5" },
	openai: { keys: ["OPENAI_API_KEY"], model: "gpt-5" },
	google: { keys: ["GOOGLE_GENERATIVE_AI_API_KEY", "GEMINI_API_KEY"], model: "gemini-flash-latest" },
	openrouter: { keys: ["OPENROUTER_API_KEY"], model: "openrouter/auto", baseURL: "https://openrouter.ai/api/v1" },
	groq: { keys: ["GROQ_API_KEY"], model: "openai/gpt-oss-120b", baseURL: "https://api.groq.com/openai/v1" },
	deepseek: { keys: ["DEEPSEEK_API_KEY"], model: "deepseek-chat", baseURL: "https://api.deepseek.com/v1" },
	xai: { keys: ["XAI_API_KEY"], model: "grok-4.7", baseURL: "https://api.x.ai/v1" },
	mistral: { keys: ["MISTRAL_API_KEY"], model: "mistral-large-latest", baseURL: "https://api.mistral.ai/v1" },
};

const ALIASES: Record<string, string> = { gemini: "google", grok: "xai", "openai-compatible": "custom" };

export interface ResolvedProvider {
	name: string;
	model: string;
	apiKey?: string;
	/** Env var the key came from, for the health check. Never the value. */
	keyEnv?: string;
	baseURL?: string;
	/** Why the bot can't call a model as configured; undefined when it can. */
	problem?: string;
}

function env(name: string): string | undefined {
	return process.env[name]?.trim() || undefined;
}

function firstKey(keys: string[]): { keyEnv?: string; apiKey?: string } {
	const keyEnv = keys.find((k) => env(k)) ?? keys[0];
	return { keyEnv, apiKey: env(keyEnv) };
}

export function resolveProvider(): ResolvedProvider {
	const requested = env("LLM_PROVIDER")?.toLowerCase();
	const name = requested ? (ALIASES[requested] ?? requested) : undefined;
	const modelOverride = env("BOT_MODEL");

	if (name === "custom" || (!name && env("LLM_BASE_URL"))) {
		const baseURL = env("LLM_BASE_URL");
		const model = modelOverride ?? "";
		const missing = [!baseURL && "LLM_BASE_URL", !model && "BOT_MODEL"].filter(Boolean);
		return {
			name: "custom",
			model,
			baseURL,
			apiKey: env("LLM_API_KEY"),
			keyEnv: "LLM_API_KEY",
			problem: missing.length ? `custom provider needs ${missing.join(" and ")}` : undefined,
		};
	}

	if (name && !PROVIDERS[name]) {
		return {
			name,
			model: modelOverride ?? "",
			problem: `unknown LLM_PROVIDER "${name}"; use one of ${[...Object.keys(PROVIDERS), "custom"].join(", ")}`,
		};
	}

	const detected = name ?? Object.keys(PROVIDERS).find((p) => PROVIDERS[p].keys.some((k) => env(k)));
	if (!detected) {
		return {
			name: "anthropic",
			model: modelOverride ?? PROVIDERS.anthropic.model,
			keyEnv: "ANTHROPIC_API_KEY",
			problem: `no LLM key set; set one of ${Object.values(PROVIDERS)
				.flatMap((p) => p.keys)
				.join(", ")}, or LLM_BASE_URL for an OpenAI-compatible endpoint`,
		};
	}

	const provider = PROVIDERS[detected];
	const { keyEnv, apiKey } = firstKey(provider.keys);
	return {
		name: detected,
		model: modelOverride ?? provider.model,
		apiKey,
		keyEnv,
		baseURL: provider.baseURL,
		problem: apiKey ? undefined : `${keyEnv} not set`,
	};
}

export function resolveModel(p: ResolvedProvider = resolveProvider()): LanguageModel {
	switch (p.name) {
		case "anthropic":
			return createAnthropic({ apiKey: p.apiKey })(p.model);
		case "openai":
			return createOpenAI({ apiKey: p.apiKey })(p.model);
		case "google":
			return createGoogleGenerativeAI({ apiKey: p.apiKey })(p.model);
		default:
			// Everything else speaks OpenAI Chat Completions; .chat() keeps the SDK
			// off the Responses API, which these endpoints don't all serve.
			return createOpenAI({ baseURL: p.baseURL, apiKey: p.apiKey ?? "" }).chat(p.model);
	}
}
