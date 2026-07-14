import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildSystemPrompt } from "../system-prompt";

const RELEVANT_ENVS = [
	"BOT_NAME",
	"ORG_NAME",
	"SYSTEM_PROMPT",
	"SYSTEM_PROMPT_APPEND",
	"LINEAR_API_KEY",
	"TAVILY_API_KEY",
	"SLACK_USER_TOKEN",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"GOOGLE_REFRESH_TOKEN",
	"GOOGLE_DRIVE_REFRESH_TOKEN",
	"DRIVE_ID",
	"NOTES_FOLDER_ID",
];

beforeEach(() => {
	for (const key of RELEVANT_ENVS) vi.stubEnv(key, "");
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("buildSystemPrompt", () => {
	it("uses the default bot name and includes guardrails + format rules", () => {
		const prompt = buildSystemPrompt();
		expect(prompt).toContain("You are Slack Agent");
		expect(prompt).toContain("## Absolute Rules");
		expect(prompt).toContain("## Response Format");
		expect(prompt).toContain("NEVER display secrets");
	});

	it("weaves in BOT_NAME and ORG_NAME", () => {
		vi.stubEnv("BOT_NAME", "Opsy");
		vi.stubEnv("ORG_NAME", "Acme Labs");
		const prompt = buildSystemPrompt();
		expect(prompt).toContain("You are Opsy, the AI assistant for Acme Labs");
	});

	it("reflects enabled tool groups", () => {
		vi.stubEnv("LINEAR_API_KEY", "lin_test");
		const prompt = buildSystemPrompt();
		expect(prompt).toContain("**Linear**");
		expect(prompt).not.toContain("**Web search**");
	});

	it("SYSTEM_PROMPT replaces the persona but guardrails survive", () => {
		vi.stubEnv("SYSTEM_PROMPT", "You are a pirate.");
		const prompt = buildSystemPrompt();
		expect(prompt).toContain("You are a pirate.");
		expect(prompt).not.toContain("You are Slack Agent");
		expect(prompt).toContain("## Absolute Rules");
	});

	it("SYSTEM_PROMPT_APPEND lands at the end", () => {
		vi.stubEnv("SYSTEM_PROMPT_APPEND", "Always answer in French.");
		const prompt = buildSystemPrompt();
		expect(prompt.trimEnd().endsWith("Always answer in French.")).toBe(true);
	});
});
