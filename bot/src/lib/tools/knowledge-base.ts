/**
 * Knowledge base tools — a Google Drive folder or shared drive as the org's
 * default source of truth. Enabled when Google OAuth creds + DRIVE_ID are set;
 * note creation additionally needs NOTES_FOLDER_ID, and editing/creating
 * arbitrary files additionally needs KB_WRITE_ENABLED.
 *
 *   DRIVE_ID — the shared drive (or My Drive folder) that holds the docs
 *   NOTES_FOLDER_ID — folder where new notes are created
 *   KB_WRITE_ENABLED — "true" to allow kbEditFile / kbCreateFile
 *   KB_NAME — display name used in tool descriptions (default "knowledge base")
 */

import { Readable } from "node:stream";
import { tool } from "ai";
import { z } from "zod";
import { getDriveClient } from "@/lib/google-auth";

const KB_NAME = process.env.KB_NAME?.trim() || "knowledge base";

/** Strip characters that could alter Drive query semantics */
function sanitizeDriveQuery(raw: string): string {
	// Strip non-alphanumeric chars (except spaces, dots, hyphens)
	let cleaned = raw.replace(/[^a-zA-Z0-9\s.-]/g, "").trim();
	// Neutralize Drive query operators that survive the regex
	cleaned = cleaned.replace(/\b(and|or|not|contains)\b/gi, "");
	// Remove standalone dots/hyphens and collapse whitespace
	cleaned = cleaned
		.replace(/(?<!\w)[.-]+(?!\w)/g, "")
		.replace(/\s+/g, " ")
		.trim();
	return cleaned;
}

/**
 * Convert a YYYY-MM-DD date into the RFC 3339 timestamp Drive expects in
 * `modifiedTime`/`createdTime` comparisons. Returns null for anything that
 * isn't a plain calendar date, so a malformed filter is dropped rather than
 * injected into the query. Exported for tests.
 */
export function toDriveRfc3339(date: string | undefined, endOfDay = false): string | null {
	if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
	return `${date}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

/**
 * Build the `modifiedTime` clause(s) for a Drive query from optional after/
 * before calendar dates. Pure and safe (only well-formed dates survive).
 * Exported for tests.
 */
export function buildDateClauses(modifiedAfter?: string, modifiedBefore?: string): string {
	const clauses: string[] = [];
	const after = toDriveRfc3339(modifiedAfter, false);
	if (after) clauses.push(`modifiedTime >= '${after}'`);
	const before = toDriveRfc3339(modifiedBefore, true);
	if (before) clauses.push(`modifiedTime <= '${before}'`);
	return clauses.join(" and ");
}

/** Map a recency preference to a Drive `orderBy` value (undefined = relevance). */
function driveOrderBy(sort: "relevance" | "newest" | "oldest" | undefined): string | undefined {
	if (sort === "newest") return "modifiedTime desc";
	if (sort === "oldest") return "modifiedTime";
	return undefined; // relevance — Drive's default full-text ranking
}

export const kbSearch = tool({
	description: `Search the ${KB_NAME} (on Google Drive) for internal documents: policies, contracts, templates, procedures, meeting notes. Keyword-ranked by default; set sort='newest' and/or the date filters to search by recency or a timeframe.`,
	inputSchema: z.object({
		query: z.string().max(500).describe("Search query — keywords like 'security policy', 'NDA template', 'pricing'"),
		limit: z.number().optional().default(10).pipe(z.number().max(50)),
		sort: z
			.enum(["relevance", "newest", "oldest"])
			.optional()
			.default("relevance")
			.describe("relevance = best keyword match (default); newest/oldest = order by last-modified time"),
		modifiedAfter: z.string().optional().describe("Only files modified on/after this date (YYYY-MM-DD)"),
		modifiedBefore: z.string().optional().describe("Only files modified on/before this date (YYYY-MM-DD)"),
	}),
	execute: async ({ query, limit, sort, modifiedAfter, modifiedBefore }) => {
		const driveId = process.env.DRIVE_ID;
		if (!driveId) return { error: "DRIVE_ID not configured — knowledge base search unavailable" };

		const safeQuery = sanitizeDriveQuery(query);
		if (!safeQuery) return { error: "Search query is empty after sanitization" };

		const dateClauses = buildDateClauses(modifiedAfter, modifiedBefore);
		const q = [`fullText contains '${safeQuery}'`, "trashed = false", dateClauses].filter(Boolean).join(" and ");

		const drive = getDriveClient();
		const MAX_RETRIES = 3;
		let lastErr: unknown;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				const res = await drive.files.list({
					q,
					driveId,
					corpora: "drive",
					includeItemsFromAllDrives: true,
					supportsAllDrives: true,
					orderBy: driveOrderBy(sort),
					fields: "files(id,name,mimeType,modifiedTime,webViewLink,parents)",
					pageSize: limit,
				});

				return (res.data.files ?? []).map((file) => ({
					name: file.name,
					type: file.mimeType,
					modified: file.modifiedTime,
					url: file.webViewLink,
					id: file.id,
				}));
			} catch (err) {
				lastErr = err;
				console.warn(`Knowledge base search attempt ${attempt}/${MAX_RETRIES} failed:`, {
					query: safeQuery,
					error: err instanceof Error ? err.message : String(err),
				});
				if (attempt < MAX_RETRIES) {
					await new Promise((r) => setTimeout(r, attempt * 500));
				}
			}
		}

		const errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
		console.error("Knowledge base search exhausted retries:", { query: safeQuery, err: lastErr });
		return { error: `Knowledge base search failed after ${MAX_RETRIES} retries: ${errMsg}` };
	},
});

export const kbRecentNotes = tool({
	description: `List the most recently modified files in the ${KB_NAME}, newest first. Use for "newest/latest note", "what changed recently", or "notes from this week/last month" questions — kbSearch ranks by keyword relevance, so it returns an arbitrary match for a recency question. Optionally narrow to files whose full text contains a keyword, or to a date range.`,
	inputSchema: z.object({
		limit: z.number().optional().default(10).pipe(z.number().max(50)),
		query: z
			.string()
			.max(500)
			.optional()
			.describe("Optional keyword to narrow the recent list (full-text). Omit to list the most recent files overall."),
		folderScope: z
			.enum(["notes", "all"])
			.optional()
			.default("notes")
			.describe("notes = only the notes folder (default when configured); all = the whole knowledge base"),
		modifiedAfter: z.string().optional().describe("Only files modified on/after this date (YYYY-MM-DD)"),
		modifiedBefore: z.string().optional().describe("Only files modified on/before this date (YYYY-MM-DD)"),
	}),
	execute: async ({ limit, query, folderScope, modifiedAfter, modifiedBefore }) => {
		const driveId = process.env.DRIVE_ID;
		if (!driveId) return { error: "DRIVE_ID not configured — knowledge base unavailable" };

		const notesFolderId = process.env.NOTES_FOLDER_ID;
		const clauses: string[] = ["trashed = false"];
		// Default to the notes folder when it exists and the caller didn't ask for the whole drive.
		if (folderScope !== "all" && notesFolderId) clauses.push(`'${notesFolderId}' in parents`);
		if (query) {
			const safeQuery = sanitizeDriveQuery(query);
			if (safeQuery) clauses.push(`fullText contains '${safeQuery}'`);
		}
		const dateClauses = buildDateClauses(modifiedAfter, modifiedBefore);
		if (dateClauses) clauses.push(dateClauses);

		try {
			const drive = getDriveClient();
			const res = await drive.files.list({
				q: clauses.join(" and "),
				driveId,
				corpora: "drive",
				includeItemsFromAllDrives: true,
				supportsAllDrives: true,
				orderBy: "modifiedTime desc",
				fields: "files(id,name,mimeType,modifiedTime,createdTime,webViewLink)",
				pageSize: limit,
			});
			return (res.data.files ?? []).map((file) => ({
				name: file.name,
				type: file.mimeType,
				modified: file.modifiedTime,
				created: file.createdTime,
				url: file.webViewLink,
				id: file.id,
			}));
		} catch (err) {
			console.error("Knowledge base recent-notes failed:", err instanceof Error ? err.message : String(err));
			return { error: "Failed to list recent notes — check deployment logs" };
		}
	},
});

/** Max characters returned by a single kbReadFile call. */
const READ_WINDOW = 15000;

/** Window a file's text, reporting whether more remains after it. */
function readWindow(content: string, offset: number) {
	const start = Math.min(offset, content.length);
	return {
		content: content.slice(start, start + READ_WINDOW),
		offset: start,
		truncated: content.length > start + READ_WINDOW,
		totalLength: content.length,
	};
}

export const kbReadFile = tool({
	description: `Read the contents of a ${KB_NAME} file by its file ID. Use after kbSearch to read a specific document. Long files come back in ${READ_WINDOW}-character windows — when the result says truncated, call again with offset set to the end of the previous window.`,
	inputSchema: z.object({
		fileId: z.string().max(200).describe("Google Drive file ID from kbSearch results"),
		fileName: z.string().max(500).optional().describe("File name for context (not required)"),
		offset: z
			.number()
			.optional()
			.default(0)
			.describe(`Character offset to start reading from — use to page through a file longer than ${READ_WINDOW} chars`),
	}),
	execute: async ({ fileId, offset }) => {
		const drive = getDriveClient();

		try {
			// Try exporting as plain text (works for Google Docs, Sheets, etc.)
			const res = await drive.files.export({
				fileId,
				mimeType: "text/plain",
			});
			const content = typeof res.data === "string" ? res.data : String(res.data);
			return readWindow(content, offset);
		} catch {
			// For non-Google files (markdown, plain text), try downloading content
			try {
				const res = await drive.files.get({
					fileId,
					alt: "media",
				});
				const content = typeof res.data === "string" ? res.data : String(res.data);
				return readWindow(content, offset);
			} catch {
				return {
					error: "Could not read file. It may be a binary file (PDF, image). Use the URL to view it directly.",
				};
			}
		}
	},
});

export const kbCreateNote = tool({
	description: `Save a markdown note to the ${KB_NAME}. Produce a complete, well-structured note — not a bare summary.

Build the content as YAML frontmatter followed by a structured body.

Frontmatter (in this order; omit a field only when it genuinely doesn't apply):
  title: "Descriptive title"
  created: YYYY-MM-DD        # today
  updated: YYYY-MM-DD        # today
  tags:                      # block list; ALWAYS lead with saved-note and web-clipping,
    - saved-note             # then 5-15 specific lowercase kebab-case tags an agent would
    - web-clipping           # search for (technologies, domains, concepts, entities)
    - ...
  description: "1-2 sentence summary"
  source_url: "https://..."  # if the note came from a web page
  source_title: "Original page title"   # if from a web page
  source_date: "YYYY-MM-DD"  # date published on the page, if any
  related:                   # links to related notes ALREADY in the KB — find them with
    - "[Other Note Title](<file-id-or-url>)"   # kbSearch BEFORE saving; omit if none found

Body:
  # Title
  > Source: <url|Original title>
  > Saved: YYYY-MM-DD

  ## Summary        (2-3 short paragraphs)
  ## Key Points     (3-7 bullets)
  ## Details        (deeper notes, if warranted)
  ## Notable Quotes / Data   (blockquoted facts/quotes, if any)

Before calling: run kbSearch to find related notes and populate \`related\`. Only assert facts supported by the source; don't inflate with unverifiable specifics. If a note for the same source already exists, this tool returns it instead of creating a duplicate — don't retry to force a second copy.`,
	inputSchema: z.object({
		fileName: z
			.string()
			.max(200)
			.regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/, "Must be YYYY-MM-DD-slug.md format")
			.describe("Filename in YYYY-MM-DD-title-slug.md format (kebab-case)"),
		content: z.string().max(50000).describe("Full markdown content including YAML frontmatter"),
	}),
	execute: async ({ fileName, content }) => {
		const folderId = process.env.NOTES_FOLDER_ID;
		if (!folderId) return { error: "NOTES_FOLDER_ID not configured — knowledge base write unavailable" };

		// Basic validation: must start with frontmatter
		if (!content.startsWith("---\n")) {
			return { error: "Content must start with YAML frontmatter (---)" };
		}

		try {
			const drive = getDriveClient();

			// Idempotency guard: if a note with this filename already exists in the
			// folder, return it instead of creating a duplicate. Without this, a
			// repeated tool call (agent retry, re-processed message) makes Drive
			// silently create a second "name (1).md" file. fileName is regex-validated
			// to [\w-] + ".md", so it's safe to interpolate into the query.
			const existing = await drive.files.list({
				q: `name = '${fileName}' and '${folderId}' in parents and trashed = false`,
				corpora: "drive",
				driveId: process.env.DRIVE_ID,
				includeItemsFromAllDrives: true,
				supportsAllDrives: true,
				fields: "files(id,name,webViewLink)",
				pageSize: 1,
			});
			const dupe = existing.data.files?.[0];
			if (dupe) {
				return {
					success: true,
					alreadyExists: true,
					name: dupe.name,
					url: dupe.webViewLink,
					id: dupe.id,
					message:
						"A note with this filename already exists — returned the existing note instead of creating a duplicate.",
				};
			}

			const res = await drive.files.create({
				requestBody: {
					name: fileName,
					mimeType: "text/markdown",
					parents: [folderId],
				},
				media: {
					mimeType: "text/markdown",
					body: Readable.from(Buffer.from(content, "utf-8")),
				},
				fields: "id,name,webViewLink",
				supportsAllDrives: true,
			});

			return {
				success: true,
				name: res.data.name,
				url: res.data.webViewLink,
				id: res.data.id,
			};
		} catch (err) {
			console.error("Knowledge base create note error:", err);
			return { error: "Failed to create note — check deployment logs" };
		}
	},
});

/**
 * Filenames the write tools accept: plain-text formats only, and no character
 * that could alter the Drive query they get interpolated into.
 */
const WRITABLE_FILENAME = /^[\w][\w .()-]{0,150}\.(md|markdown|txt|csv|json|yaml|yml)$/;

/** Google-native docs (Docs/Sheets/Slides) can't be rewritten as plain text. */
function isGoogleNative(mimeType: string | null | undefined): boolean {
	return !!mimeType?.startsWith("application/vnd.google-apps");
}

export const kbListFolders = tool({
	description: `List folders in the ${KB_NAME} so you can find where a file lives or where to put a new one. Search the whole drive by name, or list the children of one folder to walk the tree.`,
	inputSchema: z.object({
		query: z
			.string()
			.max(200)
			.optional()
			.describe("Match folders whose name contains this text — e.g. 'tasks', 'policies'. Omit to list everything."),
		parentFolderId: z
			.string()
			.max(200)
			.optional()
			.describe("List only folders directly inside this folder. Omit to search the whole knowledge base."),
		limit: z.number().optional().default(25).pipe(z.number().max(100)),
	}),
	execute: async ({ query, parentFolderId, limit }) => {
		const driveId = process.env.DRIVE_ID;
		if (!driveId) return { error: "DRIVE_ID not configured — knowledge base unavailable" };

		const clauses = ["mimeType = 'application/vnd.google-apps.folder'", "trashed = false"];
		if (parentFolderId) clauses.push(`'${sanitizeDriveQuery(parentFolderId)}' in parents`);
		if (query) {
			const safeQuery = sanitizeDriveQuery(query);
			if (safeQuery) clauses.push(`name contains '${safeQuery}'`);
		}

		try {
			const drive = getDriveClient();
			const res = await drive.files.list({
				q: clauses.join(" and "),
				driveId,
				corpora: "drive",
				includeItemsFromAllDrives: true,
				supportsAllDrives: true,
				orderBy: "name",
				fields: "files(id,name,webViewLink)",
				pageSize: limit,
			});
			return (res.data.files ?? []).map((folder) => ({
				name: folder.name,
				id: folder.id,
				url: folder.webViewLink,
			}));
		} catch (err) {
			console.error("Knowledge base list-folders failed:", err instanceof Error ? err.message : String(err));
			return { error: "Failed to list folders — check deployment logs" };
		}
	},
});

export const kbEditFile = tool({
	description: `Edit an existing text file in the ${KB_NAME} in place by replacing an exact stretch of its text — use this to tick off a checklist item, correct a line, or add a section to a file that already exists.

Read the file with kbReadFile first and copy \`oldText\` from it verbatim, including indentation and markdown markers (e.g. "- [ ] " vs "- [x] "). \`oldText\` must match exactly once unless you set replaceAll. To append, match the last line of the file and put it back followed by the new content.

Only plain-text files work (.md, .txt, .csv, .json, .yaml) — Google Docs/Sheets and binaries are rejected. The edit overwrites the file, but Drive keeps full version history, so it can be reverted.`,
	inputSchema: z.object({
		fileId: z.string().max(200).describe("Google Drive file ID from kbSearch / kbRecentNotes"),
		oldText: z.string().min(1).max(50000).describe("Exact text to replace, copied verbatim from the file"),
		newText: z.string().max(50000).describe("Replacement text — empty string deletes the matched text"),
		replaceAll: z
			.boolean()
			.optional()
			.default(false)
			.describe("Replace every occurrence. Leave false to require a unique match (safer)."),
	}),
	execute: async ({ fileId, oldText, newText, replaceAll }) => {
		if (oldText === newText) return { error: "oldText and newText are identical — nothing to change" };

		const drive = getDriveClient();

		try {
			const meta = await drive.files.get({
				fileId,
				fields: "id,name,mimeType,webViewLink",
				supportsAllDrives: true,
			});
			const mimeType = meta.data.mimeType;
			if (isGoogleNative(mimeType)) {
				return {
					error: `Cannot edit "${meta.data.name}" — it is a Google ${mimeType?.split(".").pop()} document, not a plain-text file. Open it via its URL to edit.`,
				};
			}

			const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "text" });
			const content = typeof res.data === "string" ? res.data : String(res.data);

			const occurrences = content.split(oldText).length - 1;
			if (occurrences === 0) {
				return {
					error:
						"oldText was not found in the file. Read the file again with kbReadFile and copy the text exactly, including whitespace and markdown markers.",
				};
			}
			if (occurrences > 1 && !replaceAll) {
				return {
					error: `oldText matches ${occurrences} places. Include more surrounding lines to make it unique, or set replaceAll: true.`,
				};
			}

			const updated = replaceAll ? content.split(oldText).join(newText) : content.replace(oldText, newText);

			const written = await drive.files.update({
				fileId,
				media: {
					mimeType: mimeType || "text/plain",
					body: Readable.from(Buffer.from(updated, "utf-8")),
				},
				fields: "id,name,webViewLink",
				supportsAllDrives: true,
			});

			return {
				success: true,
				name: written.data.name,
				url: written.data.webViewLink,
				id: written.data.id,
				replacements: replaceAll ? occurrences : 1,
			};
		} catch (err) {
			console.error("Knowledge base edit file error:", err);
			return { error: "Failed to edit file — it may be read-only or binary. Check deployment logs." };
		}
	},
});

export const kbCreateFile = tool({
	description: `Create a new text file anywhere in the ${KB_NAME} — a document, report, spreadsheet-style CSV, or any markdown file that is not a saved-reading note (for those use kbCreateNote).

Find the destination with kbListFolders and pass its \`folderId\`; without one the file lands in the default notes folder. Markdown files should open with YAML frontmatter (title, created, updated, tags, description) to match the rest of the ${KB_NAME}. If a file with that name already exists, this returns it untouched — edit it with kbEditFile instead of creating a second copy.`,
	inputSchema: z.object({
		fileName: z
			.string()
			.max(160)
			.regex(WRITABLE_FILENAME, "Must be a plain filename ending in .md, .txt, .csv, .json, .yaml or .yml")
			.describe("Filename with extension, e.g. 'q3-lab-throughput.md' — no slashes"),
		content: z.string().max(200000).describe("Full file content"),
		folderId: z
			.string()
			.max(200)
			.optional()
			.describe("Destination folder ID from kbListFolders. Omit to use the default notes folder."),
	}),
	execute: async ({ fileName, content, folderId }) => {
		const targetFolder = folderId || process.env.NOTES_FOLDER_ID;
		if (!targetFolder) {
			return { error: "No folderId given and NOTES_FOLDER_ID is not configured — use kbListFolders to pick a folder" };
		}

		const extension = fileName.split(".").pop()?.toLowerCase();
		const mimeType =
			extension === "md" || extension === "markdown"
				? "text/markdown"
				: extension === "csv"
					? "text/csv"
					: extension === "json"
						? "application/json"
						: "text/plain";

		try {
			const drive = getDriveClient();

			// Same idempotency guard as kbCreateNote: Drive happily creates a second
			// "name (1)" file on a retry, so return the existing one instead.
			// fileName is regex-validated, so it's safe to interpolate.
			const existing = await drive.files.list({
				q: `name = '${fileName}' and '${targetFolder}' in parents and trashed = false`,
				corpora: "drive",
				driveId: process.env.DRIVE_ID,
				includeItemsFromAllDrives: true,
				supportsAllDrives: true,
				fields: "files(id,name,webViewLink)",
				pageSize: 1,
			});
			const dupe = existing.data.files?.[0];
			if (dupe) {
				return {
					success: true,
					alreadyExists: true,
					name: dupe.name,
					url: dupe.webViewLink,
					id: dupe.id,
					message: "A file with this name already exists in that folder — use kbEditFile to change it.",
				};
			}

			const res = await drive.files.create({
				requestBody: { name: fileName, mimeType, parents: [targetFolder] },
				media: { mimeType, body: Readable.from(Buffer.from(content, "utf-8")) },
				fields: "id,name,webViewLink",
				supportsAllDrives: true,
			});

			return {
				success: true,
				name: res.data.name,
				url: res.data.webViewLink,
				id: res.data.id,
			};
		} catch (err) {
			console.error("Knowledge base create file error:", err);
			return { error: "Failed to create file — check the folder ID and deployment logs" };
		}
	},
});
