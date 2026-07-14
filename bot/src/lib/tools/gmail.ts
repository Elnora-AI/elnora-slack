import { tool } from "ai";
import { z } from "zod";
import { getGmailClient } from "@/lib/google-auth";

/** Strip CRLF to prevent email header injection */
function stripCRLF(s: string): string {
	return s.replace(/[\r\n]/g, "");
}

/**
 * Sanitize Gmail search queries. Allows safe operators only.
 * Strips characters that could be used for injection.
 */
function sanitizeGmailQuery(raw: string): string {
	// Allow: alphanumeric, spaces, common Gmail operators (from: to: subject: is: has: newer_than: older_than: label: in: after: before:)
	// Strip: backticks, pipes, semicolons, and other shell/injection chars
	return raw.replace(/[`|;${}\\]/g, "").trim();
}

export const gmailSearch = tool({
	description: "Search Gmail for emails. Returns subject, from, date, and snippet for matching messages.",
	inputSchema: z.object({
		query: z
			.string()
			.max(500)
			.describe("Gmail search query (e.g. 'from:jane@example.com', 'subject:invoice', 'is:unread newer_than:1d')"),
		limit: z.number().optional().default(10).pipe(z.number().max(25)),
	}),
	execute: async ({ query, limit }) => {
		const gmail = getGmailClient();
		const safeQuery = sanitizeGmailQuery(query);
		if (!safeQuery) return { error: "Search query is empty after sanitization" };

		const res = await gmail.users.messages.list({
			userId: "me",
			q: safeQuery,
			maxResults: limit,
		});

		if (!res.data.messages?.length) return { results: [], count: 0 };

		const messages = await Promise.all(
			res.data.messages.slice(0, limit).map(async (msg) => {
				const detail = await gmail.users.messages.get({
					userId: "me",
					id: msg.id as string,
					format: "metadata",
					metadataHeaders: ["From", "Subject", "Date"],
				});
				const headers = detail.data.payload?.headers ?? [];
				return {
					id: msg.id,
					threadId: msg.threadId,
					from: headers.find((h) => h.name === "From")?.value,
					subject: headers.find((h) => h.name === "Subject")?.value,
					date: headers.find((h) => h.name === "Date")?.value,
					snippet: detail.data.snippet,
				};
			}),
		);

		return { results: messages, count: messages.length };
	},
});

export const gmailDraft = tool({
	description: "Create a Gmail draft. Does NOT send — drafts must be reviewed and approved before sending.",
	inputSchema: z.object({
		to: z.string().max(500).describe("Recipient email address"),
		subject: z.string().max(500).describe("Email subject"),
		body: z.string().max(10000).describe("Email body (plain text)"),
		cc: z.string().max(500).optional().describe("CC email address"),
	}),
	execute: async ({ to, subject, body, cc }) => {
		const gmail = getGmailClient();

		// Strip CRLF from header values to prevent header injection
		const headers = [
			`To: ${stripCRLF(to)}`,
			`Subject: ${stripCRLF(subject)}`,
			`Content-Type: text/plain; charset=utf-8`,
		];
		if (cc) headers.push(`Cc: ${stripCRLF(cc)}`);

		const raw = Buffer.from(`${headers.join("\r\n")}\r\n\r\n${body}`).toString("base64url");

		const res = await gmail.users.drafts.create({
			userId: "me",
			requestBody: { message: { raw } },
		});

		return {
			draftId: res.data.id,
			to,
			subject,
			body,
			status: "Draft created — NOT sent. Show it to the user and get explicit approval before sending.",
		};
	},
});

export const gmailSendDraft = tool({
	description: "Send a previously created Gmail draft. Only use AFTER the user has explicitly approved the draft.",
	needsApproval: true,
	inputSchema: z.object({
		draftId: z.string().max(200).describe("Draft ID from gmailDraft tool"),
	}),
	execute: async ({ draftId }) => {
		const gmail = getGmailClient();
		const res = await gmail.users.drafts.send({
			userId: "me",
			requestBody: { id: draftId },
		});

		return {
			messageId: res.data.id,
			threadId: res.data.threadId,
			status: "Sent",
		};
	},
});

export const gmailGetThread = tool({
	description: "Get the full email thread by thread ID. Use to read conversation context before replying.",
	inputSchema: z.object({
		threadId: z.string().max(200).describe("Gmail thread ID"),
	}),
	execute: async ({ threadId }) => {
		const gmail = getGmailClient();
		const res = await gmail.users.threads.get({
			userId: "me",
			id: threadId,
			format: "metadata",
			metadataHeaders: ["From", "To", "Subject", "Date"],
		});

		return (res.data.messages ?? []).map((msg) => {
			const headers = msg.payload?.headers ?? [];
			return {
				id: msg.id,
				from: headers.find((h) => h.name === "From")?.value,
				to: headers.find((h) => h.name === "To")?.value,
				subject: headers.find((h) => h.name === "Subject")?.value,
				date: headers.find((h) => h.name === "Date")?.value,
				snippet: msg.snippet,
			};
		});
	},
});
