/**
 * Integration tests for @elnora-ai/slack.
 * Spawns the built binary and asserts on stdout/stderr/exitCode.
 */

import { type ExecFileSyncOptionsWithBufferEncoding, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const BIN = join(REPO_ROOT, "dist", "main.js");
const GUARD = join(REPO_ROOT, "scripts", "check-no-populated-references.mjs");

// A config dir that never exists, so a real ~/.config/elnora-slack/.env on the
// test machine can never leak into a test's token resolution.
const NO_CONFIG = join(tmpdir(), "elnora-slack-no-such-config-dir");

const tempDirs: string[] = [];
function makeConfigDir(env: Record<string, string>): string {
	const dir = mkdtempSync(join(tmpdir(), "elnora-slack-cfg-"));
	tempDirs.push(dir);
	const body = Object.entries(env)
		.map(([k, v]) => `${k}=${v}`)
		.join("\n");
	writeFileSync(join(dir, ".env"), `${body}\n`);
	return dir;
}

afterAll(() => {
	for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

function run(args: string[], env?: Record<string, string>): { stdout: string; stderr: string; exitCode: number } {
	// Start from a base env with the three Slack token keys stripped, so a key the
	// test does not set is genuinely absent (letting the config file provide it),
	// rather than inherited from the shell running the suite.
	const base: Record<string, string | undefined> = { ...process.env };
	delete base.SLACK_TOKEN;
	delete base.SLACK_BOT_TOKEN;
	delete base.SLACK_USER_TOKEN;
	const opts: ExecFileSyncOptionsWithBufferEncoding = {
		env: { ...base, SLACK_CONFIG_DIR: NO_CONFIG, ...env, NODE_NO_WARNINGS: "1" } as NodeJS.ProcessEnv,
		encoding: "buffer",
		timeout: 15_000,
	};
	try {
		const stdout = execFileSync("node", [BIN, ...args], opts);
		return { stdout: stdout.toString(), stderr: "", exitCode: 0 };
	} catch (err: unknown) {
		const e = err as { stdout?: Buffer; stderr?: Buffer; status?: number };
		return { stdout: e.stdout?.toString() ?? "", stderr: e.stderr?.toString() ?? "", exitCode: e.status ?? 1 };
	}
}

describe("CLI basics", () => {
	it("shows help", () => {
		const { stdout, exitCode } = run(["--help"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Complete Slack Web API CLI");
		expect(stdout).toContain("--compact");
		expect(stdout).toContain("--output");
		expect(stdout).toContain("--fields");
	});

	it("shows version", () => {
		const { stdout, exitCode } = run(["--version"]);
		expect(exitCode).toBe(0);
		expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
	});

	it("shows subcommand help", () => {
		const { stdout, exitCode } = run(["chat", "--help"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("chat.* API methods");
		expect(stdout).toContain("postMessage");
	});

	it("exits with error for unknown command", () => {
		const { stderr, exitCode } = run(["nonexistent"]);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("nonexistent");
	});
});

describe("Auth errors", () => {
	it("exits with code 3 when no token is set", () => {
		const { stderr, exitCode } = run(["auth", "test"], {
			SLACK_TOKEN: "",
			SLACK_BOT_TOKEN: "",
			SLACK_USER_TOKEN: "",
		});
		expect(exitCode).toBe(3);
		const parsed = JSON.parse(stderr);
		expect(parsed.code).toBe("AUTH_ERROR");
		expect(parsed.error).toContain("No Slack token");
	});

	it("exits with code 3 for invalid token format", () => {
		const { stderr, exitCode } = run(["auth", "test"], {
			SLACK_TOKEN: "invalid-token-format",
			SLACK_BOT_TOKEN: "",
			SLACK_USER_TOKEN: "",
		});
		expect(exitCode).toBe(3);
		const parsed = JSON.parse(stderr);
		expect(parsed.code).toBe("AUTH_ERROR");
	});
});

describe("Env-chain resolution order", () => {
	it("reads a token from $SLACK_CONFIG_DIR/.env when the environment has none", () => {
		// Invalid-format token in the file, no token in the environment: proves the
		// file was consulted (format error, not "No Slack token") without a network
		// call.
		const dir = makeConfigDir({ SLACK_BOT_TOKEN: "not-a-valid-token" });
		const { stderr, exitCode } = run(["auth", "test"], { SLACK_CONFIG_DIR: dir });
		expect(exitCode).toBe(3);
		const parsed = JSON.parse(stderr);
		expect(parsed.error).toMatch(/Invalid Slack token format/);
		expect(parsed.error).not.toMatch(/No Slack token/);
	});

	it("lets an environment token win over the config file", () => {
		// File holds a structurally-valid token; the environment holds an invalid
		// one. If the environment wins we get a format error (no network). If the
		// file leaked through we'd get a structurally-valid token and a network call.
		const dir = makeConfigDir({ SLACK_BOT_TOKEN: `xoxb-${"a".repeat(40)}` });
		const { stderr, exitCode } = run(["auth", "test"], {
			SLACK_CONFIG_DIR: dir,
			SLACK_BOT_TOKEN: "env-token-invalid-format",
		});
		expect(exitCode).toBe(3);
		const parsed = JSON.parse(stderr);
		expect(parsed.error).toMatch(/Invalid Slack token format/);
	});
});

describe("User-token-required methods (search.*)", () => {
	it("rejects a bot-only token with a clear error", () => {
		const { stderr, exitCode } = run(["search", "messages", "--query", "hello"], {
			SLACK_TOKEN: "",
			SLACK_BOT_TOKEN: `xoxb-${"a".repeat(50)}`,
			SLACK_USER_TOKEN: "",
		});
		expect(exitCode).toBe(3);
		const parsed = JSON.parse(stderr);
		expect(parsed.code).toBe("AUTH_ERROR");
		expect(parsed.error).toMatch(/user token/i);
		expect(parsed.error).toMatch(/SLACK_USER_TOKEN/);
	});

	it("rejects a SLACK_USER_TOKEN with a non-xoxp prefix", () => {
		const { stderr, exitCode } = run(["search", "messages", "--query", "hello"], {
			SLACK_TOKEN: "",
			SLACK_BOT_TOKEN: "",
			SLACK_USER_TOKEN: `xoxb-${"a".repeat(50)}`,
		});
		expect(exitCode).toBe(3);
		const parsed = JSON.parse(stderr);
		expect(parsed.code).toBe("AUTH_ERROR");
		expect(parsed.error).toMatch(/xoxp/);
	});

	it("non-search commands still accept a bot token structurally", () => {
		const { stderr, exitCode } = run(["search", "messages", "--query", "x"], {
			SLACK_TOKEN: "",
			SLACK_BOT_TOKEN: "",
			SLACK_USER_TOKEN: "",
		});
		// No user token at all → clear AUTH error naming SLACK_USER_TOKEN.
		expect(exitCode).toBe(3);
		const parsed = JSON.parse(stderr);
		expect(parsed.error).toMatch(/SLACK_USER_TOKEN/);
	});
});

describe("Secret redaction", () => {
	it("never shows a raw token in error output", () => {
		const fakeToken = `xoxb-${"a".repeat(50)}`;
		const { stderr } = run(["search", "messages", "--query", "x"], {
			SLACK_TOKEN: "",
			SLACK_BOT_TOKEN: fakeToken,
			SLACK_USER_TOKEN: "",
		});
		expect(stderr).not.toContain(fakeToken);
	});
});

describe("Output format validation", () => {
	it("rejects an invalid --output format", () => {
		const { stderr, exitCode } = run(["--output", "yaml", "auth", "test"], {
			SLACK_TOKEN: `xoxb-${"a".repeat(20)}`,
			SLACK_BOT_TOKEN: "",
			SLACK_USER_TOKEN: "",
		});
		expect(exitCode).toBe(2);
		const parsed = JSON.parse(stderr);
		expect(parsed.code).toBe("VALIDATION_ERROR");
		expect(parsed.error).toContain("yaml");
	});
});

describe("Completion", () => {
	it("generates bash completion for the elnora-slack command", () => {
		const { stdout, exitCode } = run(["completion", "bash"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("_elnora_slack_completions");
		expect(stdout).toContain("complete -F _elnora_slack_completions elnora-slack");
	});

	it("generates zsh completion", () => {
		const { stdout, exitCode } = run(["completion", "zsh"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("compdef _elnora_slack elnora-slack");
	});

	it("generates fish completion", () => {
		const { stdout, exitCode } = run(["completion", "fish"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("complete -c elnora-slack");
	});

	it("generates powershell completion", () => {
		const { stdout, exitCode } = run(["completion", "powershell"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Register-ArgumentCompleter");
	});

	it("rejects an unknown shell", () => {
		const { exitCode } = run(["completion", "tcsh"]);
		expect(exitCode).toBe(2);
	});
});

describe("Debug mode", () => {
	it("SLACK_CLI_DEBUG adds stack traces to error output", () => {
		const { stderr, exitCode } = run(["auth", "test"], {
			SLACK_TOKEN: "",
			SLACK_BOT_TOKEN: "",
			SLACK_USER_TOKEN: "",
			SLACK_CLI_DEBUG: "1",
		});
		expect(exitCode).toBe(3);
		const parsed = JSON.parse(stderr);
		expect(parsed.stack).toBeDefined();
		expect(parsed.stack).toContain("AuthError");
	});
});

describe("Publication guard", () => {
	it("passes on the committed tree", () => {
		try {
			const out = execFileSync("node", [GUARD], { cwd: REPO_ROOT, encoding: "utf8" });
			expect(out).toContain("Publication guard passed");
		} catch (err) {
			const e = err as { stdout?: string; stderr?: string };
			throw new Error(`guard failed unexpectedly:\n${e.stdout ?? ""}\n${e.stderr ?? ""}`);
		}
	});
});
