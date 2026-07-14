import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildTools, toolGroups } from "../tools";

const GATING_ENVS = [
	"LINEAR_API_KEY",
	"TAVILY_API_KEY",
	"EXA_API_KEY",
	"PERPLEXITY_API_KEY",
	"VALYU_API_KEY",
	"SLACK_USER_TOKEN",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"GOOGLE_REFRESH_TOKEN",
	"GOOGLE_DRIVE_REFRESH_TOKEN",
	"DRIVE_ID",
	"NOTES_FOLDER_ID",
];

beforeEach(() => {
	// Blank every gating env so the host machine's real keys can't leak in.
	for (const key of GATING_ENVS) vi.stubEnv(key, "");
});

afterEach(() => {
	vi.unstubAllEnvs();
});

function enabledKeys(): string[] {
	return toolGroups()
		.filter((g) => g.enabled)
		.map((g) => g.key);
}

describe("tool registry gating", () => {
	it("only the system group is enabled with a bare environment", () => {
		expect(enabledKeys()).toEqual(["system"]);
		const tools = buildTools();
		expect(Object.keys(tools).sort()).toEqual(["help", "systemStatus"]);
	});

	it("LINEAR_API_KEY enables the Linear group", () => {
		vi.stubEnv("LINEAR_API_KEY", "lin_api_test");
		expect(enabledKeys()).toContain("linear");
		const tools = buildTools();
		expect(tools).toHaveProperty("linearListTeams");
		expect(tools).toHaveProperty("linearCreateIssue");
		expect(tools).toHaveProperty("linearSearchIssues");
		expect(tools).toHaveProperty("linearRecentIssues");
	});

	it("TAVILY_API_KEY enables web search", () => {
		vi.stubEnv("TAVILY_API_KEY", "tvly-test");
		expect(enabledKeys()).toContain("web-search");
		expect(buildTools()).toHaveProperty("webSearch");
		expect(buildTools()).toHaveProperty("webExtract");
	});

	it("SLACK_USER_TOKEN enables Slack search", () => {
		vi.stubEnv("SLACK_USER_TOKEN", "xoxp-test");
		expect(enabledKeys()).toContain("slack-search");
		expect(buildTools()).toHaveProperty("slackSearchMessages");
	});

	it("knowledge base needs Google OAuth creds AND DRIVE_ID", () => {
		vi.stubEnv("DRIVE_ID", "0ABCdrive");
		expect(enabledKeys()).not.toContain("knowledge-base");

		vi.stubEnv("GOOGLE_CLIENT_ID", "cid");
		vi.stubEnv("GOOGLE_CLIENT_SECRET", "csec");
		expect(enabledKeys()).not.toContain("knowledge-base");

		vi.stubEnv("GOOGLE_REFRESH_TOKEN", "rtok");
		expect(enabledKeys()).toContain("knowledge-base");
	});

	it("kbCreateNote only registers when NOTES_FOLDER_ID is set", () => {
		vi.stubEnv("GOOGLE_CLIENT_ID", "cid");
		vi.stubEnv("GOOGLE_CLIENT_SECRET", "csec");
		vi.stubEnv("GOOGLE_DRIVE_REFRESH_TOKEN", "rtok");
		vi.stubEnv("DRIVE_ID", "0ABCdrive");

		let tools = buildTools();
		expect(tools).toHaveProperty("kbSearch");
		expect(tools).toHaveProperty("kbReadFile");
		expect(tools).not.toHaveProperty("kbCreateNote");

		vi.stubEnv("NOTES_FOLDER_ID", "folder123");
		tools = buildTools();
		expect(tools).toHaveProperty("kbCreateNote");
	});

	it("GOOGLE_REFRESH_TOKEN with OAuth creds enables Gmail and Calendar", () => {
		vi.stubEnv("GOOGLE_CLIENT_ID", "cid");
		vi.stubEnv("GOOGLE_CLIENT_SECRET", "csec");
		vi.stubEnv("GOOGLE_REFRESH_TOKEN", "rtok");
		const keys = enabledKeys();
		expect(keys).toContain("gmail");
		expect(keys).toContain("calendar");
		const tools = buildTools();
		expect(tools).toHaveProperty("gmailDraft");
		expect(tools).toHaveProperty("calendarListEvents");
	});
});
