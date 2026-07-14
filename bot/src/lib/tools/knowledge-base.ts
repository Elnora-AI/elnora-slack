/**
 * Knowledge base tools — a Google Drive folder or shared drive as the org's
 * default source of truth. Enabled when Google OAuth creds + DRIVE_ID are set;
 * note creation additionally needs NOTES_FOLDER_ID.
 *
 *   DRIVE_ID — the shared drive (or My Drive folder) that holds the docs
 *   NOTES_FOLDER_ID — folder where new notes are created
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

export const kbSearch = tool({
	description: `Search the ${KB_NAME} (on Google Drive) for internal documents: policies, contracts, templates, procedures, meeting notes.`,
	inputSchema: z.object({
		query: z.string().max(500).describe("Search query — keywords like 'security policy', 'NDA template', 'pricing'"),
		limit: z.number().optional().default(10).pipe(z.number().max(50)),
	}),
	execute: async ({ query, limit }) => {
		const driveId = process.env.DRIVE_ID;
		if (!driveId) return { error: "DRIVE_ID not configured — knowledge base search unavailable" };

		const safeQuery = sanitizeDriveQuery(query);
		if (!safeQuery) return { error: "Search query is empty after sanitization" };

		const drive = getDriveClient();
		const MAX_RETRIES = 3;
		let lastErr: unknown;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				const res = await drive.files.list({
					q: `fullText contains '${safeQuery}' and trashed = false`,
					driveId,
					corpora: "drive",
					includeItemsFromAllDrives: true,
					supportsAllDrives: true,
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

export const kbReadFile = tool({
	description: `Read the contents of a ${KB_NAME} file by its file ID. Use after kbSearch to read a specific document.`,
	inputSchema: z.object({
		fileId: z.string().max(200).describe("Google Drive file ID from kbSearch results"),
		fileName: z.string().max(500).optional().describe("File name for context (not required)"),
	}),
	execute: async ({ fileId }) => {
		const drive = getDriveClient();

		try {
			// Try exporting as plain text (works for Google Docs, Sheets, etc.)
			const res = await drive.files.export({
				fileId,
				mimeType: "text/plain",
			});
			const content = typeof res.data === "string" ? res.data : String(res.data);
			return {
				content: content.slice(0, 15000),
				truncated: content.length > 15000,
				totalLength: content.length,
			};
		} catch {
			// For non-Google files (markdown, plain text), try downloading content
			try {
				const res = await drive.files.get({
					fileId,
					alt: "media",
				});
				const content = typeof res.data === "string" ? res.data : String(res.data);
				return {
					content: content.slice(0, 15000),
					truncated: content.length > 15000,
					totalLength: content.length,
				};
			} catch {
				return {
					error: "Could not read file. It may be a binary file (PDF, image). Use the URL to view it directly.",
				};
			}
		}
	},
});

export const kbCreateNote = tool({
	description: `Save a markdown note to the ${KB_NAME}. Build the full markdown content with YAML frontmatter (title, created YYYY-MM-DD, tags, description, and source_url if the note came from a web page) before calling.`,
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
