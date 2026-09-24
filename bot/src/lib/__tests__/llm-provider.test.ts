import type { LanguageModel } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROVIDERS, resolveModel, resolveProvider } from "../llm-provider";

const LLM_ENVS = [
	"LLM_PROVIDER",
	"BOT_MODEL",
	"LLM_BASE_URL",
	"LLM_API_KEY",
	...Object.values(PROVIDERS).flatMap((p) => p.keys),
];

beforeEach(() => {
	// Blank every LLM env so the host machine's real keys can't leak in.
	for (const key of LLM_ENVS) vi.stubEnv(key, "");
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("resolveProvider", () => {
	it("picks the provider from whichever key is set", () => {
		vi.stubEnv("OPENAI_API_KEY", "k");
		expect(resolveProvider()).toMatchObject({ name: "openai", model: "gpt-5", keyEnv: "OPENAI_API_KEY" });
	});

	it("detects every provider from its own key", () => {
		for (const [name, p] of Object.entries(PROVIDERS)) {
			for (const key of p.keys) {
				vi.stubEnv(key, "k");
				expect(resolveProvider()).toMatchObject({ name, keyEnv: key, problem: undefined });
				vi.stubEnv(key, "");
			}
		}
	});

	it("keeps Anthropic first when several keys are set", () => {
		vi.stubEnv("OPENROUTER_API_KEY", "k");
		vi.stubEnv("ANTHROPIC_API_KEY", "k");
		expect(resolveProvider().name).toBe("anthropic");
	});

	it("LLM_PROVIDER beats detection, and aliases resolve", () => {
		vi.stubEnv("ANTHROPIC_API_KEY", "k");
		vi.stubEnv("GEMINI_API_KEY", "k");
		vi.stubEnv("LLM_PROVIDER", "Gemini");
		expect(resolveProvider()).toMatchObject({ name: "google", keyEnv: "GEMINI_API_KEY" });
	});

	it("BOT_MODEL overrides the default model", () => {
		vi.stubEnv("OPENROUTER_API_KEY", "k");
		vi.stubEnv("BOT_MODEL", "anthropic/claude-sonnet-5");
		expect(resolveProvider()).toMatchObject({ name: "openrouter", model: "anthropic/claude-sonnet-5" });
	});

	it("LLM_BASE_URL selects any OpenAI-compatible endpoint", () => {
		vi.stubEnv("LLM_BASE_URL", "https://api.together.xyz/v1");
		vi.stubEnv("LLM_API_KEY", "k");
		vi.stubEnv("BOT_MODEL", "some/model");
		expect(resolveProvider()).toMatchObject({
			name: "custom",
			baseURL: "https://api.together.xyz/v1",
			model: "some/model",
			problem: undefined,
		});
	});

	it("reports what a custom endpoint is missing", () => {
		vi.stubEnv("LLM_PROVIDER", "custom");
		expect(resolveProvider().problem).toBe("custom provider needs LLM_BASE_URL and BOT_MODEL");
	});

	it("reports a missing key for the chosen provider", () => {
		vi.stubEnv("LLM_PROVIDER", "groq");
		expect(resolveProvider().problem).toBe("GROQ_API_KEY not set");
	});

	it("reports an unknown provider name", () => {
		vi.stubEnv("LLM_PROVIDER", "nope");
		expect(resolveProvider().problem).toMatch(/unknown LLM_PROVIDER "nope"/);
	});

	it("reports no key at all", () => {
		expect(resolveProvider().problem).toMatch(/^no LLM key set/);
	});
});

describe("resolveModel", () => {
	it("builds a model for every provider", () => {
		for (const [name, p] of Object.entries(PROVIDERS)) {
			vi.stubEnv(p.keys[0], "k");
			const model = resolveModel();
			expect(model, name).toMatchObject({ modelId: p.model });
			vi.stubEnv(p.keys[0], "");
		}
	});

	it("sends OpenAI-compatible providers to their own endpoint with their key", async () => {
		const calls: { url: string; auth: string | null }[] = [];
		vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
			calls.push({ url, auth: new Headers(init.headers).get("authorization") });
			throw new Error("stop");
		});
		const prompt = [{ role: "user" as const, content: [{ type: "text" as const, text: "hi" }] }];
		for (const [name, p] of Object.entries(PROVIDERS)) {
			if (!p.baseURL) continue;
			vi.stubEnv(p.keys[0], `key-${name}`);
			await Promise.resolve((resolveModel() as Exclude<LanguageModel, string>).doGenerate({ prompt })).catch(() => {});
			expect(calls.at(-1), name).toEqual({ url: `${p.baseURL}/chat/completions`, auth: `Bearer key-${name}` });
			vi.stubEnv(p.keys[0], "");
		}
		vi.unstubAllGlobals();
	});
});
