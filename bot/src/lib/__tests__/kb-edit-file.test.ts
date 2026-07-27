import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const update = vi.fn();
const list = vi.fn();
const create = vi.fn();

vi.mock("@/lib/google-auth", () => ({
	getDriveClient: () => ({ files: { get, update, list, create } }),
}));

// Imported after the mock is registered.
const { kbEditFile, kbCreateFile } = await import("../tools/knowledge-base");

type Exec<I> = { execute: (i: I) => Promise<Record<string, unknown>> };

interface EditInput {
	fileId: string;
	oldText: string;
	newText: string;
	replaceAll?: boolean;
}

async function edit(input: EditInput) {
	return (kbEditFile as unknown as Exec<EditInput>).execute({ replaceAll: false, ...input });
}

/** Mock the metadata call, then the content download. */
function mockFile(content: string, mimeType = "text/markdown") {
	get.mockImplementation((params: { alt?: string }) =>
		params.alt === "media"
			? Promise.resolve({ data: content })
			: Promise.resolve({ data: { id: "f1", name: "inbox.md", mimeType, webViewLink: "https://drive/f1" } }),
	);
}

/** The content the tool actually wrote back, decoded from the upload stream. */
async function writtenContent(): Promise<string> {
	const body = update.mock.calls[0][0].media.body as AsyncIterable<Buffer>;
	const chunks: Buffer[] = [];
	for await (const chunk of body) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks).toString("utf-8");
}

beforeEach(() => {
	vi.stubEnv("NOTES_FOLDER_ID", "folder123");
	vi.stubEnv("DRIVE_ID", "drive123");
	get.mockReset();
	update.mockReset();
	list.mockReset();
	create.mockReset();
	update.mockResolvedValue({ data: { id: "f1", name: "inbox.md", webViewLink: "https://drive/f1" } });
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("kbEditFile", () => {
	it("replaces a unique match and writes the whole file back", async () => {
		mockFile("- [ ] call Britt\n- [ ] call Kadri\n");

		const res = await edit({ fileId: "f1", oldText: "- [ ] call Britt", newText: "- [x] call Britt" });

		expect(res.success).toBe(true);
		expect(res.replacements).toBe(1);
		expect(await writtenContent()).toBe("- [x] call Britt\n- [ ] call Kadri\n");
	});

	it("refuses an ambiguous match unless replaceAll is set", async () => {
		mockFile("- [ ] todo\n- [ ] todo\n");

		const res = await edit({ fileId: "f1", oldText: "- [ ] todo", newText: "- [x] todo" });

		expect(res.error).toMatch(/matches 2 places/);
		expect(update).not.toHaveBeenCalled();
	});

	it("replaces every occurrence with replaceAll", async () => {
		mockFile("- [ ] todo\n- [ ] todo\n");

		const res = await edit({ fileId: "f1", oldText: "- [ ] todo", newText: "- [x] todo", replaceAll: true });

		expect(res.replacements).toBe(2);
		expect(await writtenContent()).toBe("- [x] todo\n- [x] todo\n");
	});

	it("reports a miss instead of writing", async () => {
		mockFile("- [ ] call Britt\n");

		const res = await edit({ fileId: "f1", oldText: "- [ ] call Someone Else", newText: "- [x] done" });

		expect(res.error).toMatch(/not found/i);
		expect(update).not.toHaveBeenCalled();
	});

	it("rejects Google-native documents", async () => {
		mockFile("irrelevant", "application/vnd.google-apps.document");

		const res = await edit({ fileId: "f1", oldText: "a", newText: "b" });

		expect(res.error).toMatch(/Google/);
		expect(update).not.toHaveBeenCalled();
	});

	it("rejects a no-op edit before touching Drive", async () => {
		const res = await edit({ fileId: "f1", oldText: "same", newText: "same" });

		expect(res.error).toMatch(/identical/);
		expect(get).not.toHaveBeenCalled();
	});
});

interface CreateInput {
	fileName: string;
	content: string;
	folderId?: string;
}

async function createFile(input: CreateInput) {
	return (kbCreateFile as unknown as Exec<CreateInput>).execute(input);
}

describe("kbCreateFile", () => {
	it("creates the file in the folder it was given", async () => {
		list.mockResolvedValue({ data: { files: [] } });
		create.mockResolvedValue({ data: { id: "new1", name: "report.md", webViewLink: "https://drive/new1" } });

		const res = await createFile({ fileName: "report.md", content: "# Report\n", folderId: "tasks99" });

		expect(res.success).toBe(true);
		expect(create.mock.calls[0][0].requestBody.parents).toEqual(["tasks99"]);
		expect(create.mock.calls[0][0].requestBody.mimeType).toBe("text/markdown");
	});

	it("falls back to the notes folder when no folderId is given", async () => {
		list.mockResolvedValue({ data: { files: [] } });
		create.mockResolvedValue({ data: { id: "new1", name: "report.md", webViewLink: "https://drive/new1" } });

		await createFile({ fileName: "report.md", content: "# Report\n" });

		expect(create.mock.calls[0][0].requestBody.parents).toEqual(["folder123"]);
	});

	it("returns the existing file rather than duplicating it", async () => {
		list.mockResolvedValue({
			data: { files: [{ id: "old1", name: "report.md", webViewLink: "https://drive/old1" }] },
		});

		const res = await createFile({ fileName: "report.md", content: "# Report\n", folderId: "tasks99" });

		expect(res.alreadyExists).toBe(true);
		expect(create).not.toHaveBeenCalled();
	});
});
