import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const list = vi.fn();
const create = vi.fn();

vi.mock("@/lib/google-auth", () => ({
	getDriveClient: () => ({ files: { list, create } }),
}));

// Imported after the mock is registered.
const { kbCreateNote } = await import("../tools/knowledge-base");

const VALID = {
	fileName: "2026-07-15-example-note.md",
	content: "---\ntitle: Example\n---\n\n# Example\n",
};

async function run(input: { fileName: string; content: string }) {
	// The `ai` tool wrapper exposes the implementation as `execute`.
	return (kbCreateNote as unknown as { execute: (i: typeof input) => Promise<Record<string, unknown>> }).execute(input);
}

beforeEach(() => {
	vi.stubEnv("NOTES_FOLDER_ID", "folder123");
	vi.stubEnv("DRIVE_ID", "drive123");
	list.mockReset();
	create.mockReset();
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("kbCreateNote idempotency guard", () => {
	it("returns the existing note without creating a duplicate", async () => {
		list.mockResolvedValue({
			data: { files: [{ id: "existing1", name: VALID.fileName, webViewLink: "https://drive/existing1" }] },
		});

		const res = await run(VALID);

		expect(res.alreadyExists).toBe(true);
		expect(res.id).toBe("existing1");
		expect(create).not.toHaveBeenCalled();
	});

	it("creates the note when none exists yet", async () => {
		list.mockResolvedValue({ data: { files: [] } });
		create.mockResolvedValue({
			data: { id: "new1", name: VALID.fileName, webViewLink: "https://drive/new1" },
		});

		const res = await run(VALID);

		expect(res.success).toBe(true);
		expect(res.alreadyExists).toBeUndefined();
		expect(create).toHaveBeenCalledOnce();
	});

	it("rejects content without frontmatter before touching Drive", async () => {
		const res = await run({ fileName: VALID.fileName, content: "no frontmatter here" });

		expect(res.error).toMatch(/frontmatter/i);
		expect(list).not.toHaveBeenCalled();
		expect(create).not.toHaveBeenCalled();
	});
});
