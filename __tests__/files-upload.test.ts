/**
 * Unit tests for `files upload`, which runs on the @slack/web-api filesUploadV2
 * helper (the legacy files.upload API was sunset in 2025). The WebClient is
 * mocked so we can assert on the argument object the command constructs without
 * a network call.
 */

import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { uploadMock, apiCallMock } = vi.hoisted(() => ({
	uploadMock: vi.fn(),
	apiCallMock: vi.fn(),
}));

vi.mock("@slack/web-api", () => {
	class WebClient {
		filesUploadV2 = uploadMock;
		apiCall = apiCallMock;
	}
	return {
		WebClient,
		LogLevel: { DEBUG: "debug", ERROR: "error", INFO: "info", WARN: "warn" },
	};
});

import { setupFilesCommand } from "../src/commands/files.js";

function uploadArgs(argv: string[]): Promise<void> {
	const program = new Command();
	program.exitOverride();
	setupFilesCommand(program);
	return program.parseAsync(["files", "upload", ...argv], { from: "user" });
}

describe("files upload (filesUploadV2)", () => {
	beforeEach(() => {
		// A structurally valid bot token so getClient() builds the (mocked) client.
		process.env.SLACK_CONFIG_DIR = "/elnora-slack-no-such-config-dir";
		process.env.SLACK_TOKEN = "";
		process.env.SLACK_USER_TOKEN = "";
		process.env.SLACK_BOT_TOKEN = `xoxb-${"a".repeat(20)}`;
		uploadMock.mockReset();
		uploadMock.mockResolvedValue({ ok: true, files: [{ id: "F0FAKE" }] });
		apiCallMock.mockReset();
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("calls filesUploadV2 (not the sunset files.upload) and maps the flags", async () => {
		await uploadArgs([
			"--content",
			"hello world",
			"--filename",
			"note.txt",
			"--title",
			"My Note",
			"--initial-comment",
			"see attached",
			"--thread-ts",
			"1700000000.000100",
			"--channels",
			"C111",
		]);

		expect(uploadMock).toHaveBeenCalledTimes(1);
		expect(apiCallMock).not.toHaveBeenCalled();
		const arg = uploadMock.mock.calls[0][0] as Record<string, unknown>;
		expect(arg).toMatchObject({
			content: "hello world",
			filename: "note.txt",
			title: "My Note",
			initial_comment: "see attached",
			thread_ts: "1700000000.000100",
			channel_id: "C111",
		});
		expect(arg.file).toBeUndefined();
	});

	it("collapses a comma-separated --channels list to the first channel_id", async () => {
		await uploadArgs(["--content", "x", "--channels", "C111, C222,C333"]);

		const arg = uploadMock.mock.calls[0][0] as Record<string, unknown>;
		expect(arg.channel_id).toBe("C111");
		// filesUploadV2 uses channel_id; the legacy `channels` field is not passed.
		expect(arg.channels).toBeUndefined();
	});

	it("passes --file through as a disk path when no --content is given", async () => {
		await uploadArgs(["--file", "/tmp/report.pdf", "--filename", "report.pdf", "--channels", "C999"]);

		const arg = uploadMock.mock.calls[0][0] as Record<string, unknown>;
		expect(arg.file).toBe("/tmp/report.pdf");
		expect(arg.channel_id).toBe("C999");
		expect(arg.content).toBeUndefined();
	});
});
