import { tool } from "ai";
import { z } from "zod";

const TAVILY_BASE = "https://api.tavily.com";

/** Reject URLs pointing to private/internal networks */
function isPublicUrl(urlStr: string): boolean {
	try {
		const parsed = new URL(urlStr);
		if (parsed.protocol !== "https:") return false;
		const host = parsed.hostname.toLowerCase();
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return false;
		if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(host)) return false;
		if (host === "169.254.169.254") return false; // cloud metadata
		if (host.endsWith(".internal") || host.endsWith(".local")) return false;
		return true;
	} catch {
		return false;
	}
}

export const webSearch = tool({
	description:
		"Search the web for current information. Use for recent events, market data, or anything not in internal sources.",
	inputSchema: z.object({
		query: z.string().max(500).describe("Search query"),
		searchDepth: z
			.enum(["basic", "advanced"])
			.optional()
			.default("basic")
			.describe("'basic' for quick answers, 'advanced' for deeper research"),
		limit: z.number().optional().default(5).pipe(z.number().max(20)),
	}),
	execute: async ({ query, searchDepth, limit }) => {
		const apiKey = process.env.TAVILY_API_KEY;
		if (!apiKey) return { error: "TAVILY_API_KEY not configured" };

		const res = await fetch(`${TAVILY_BASE}/search`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				query,
				search_depth: searchDepth,
				max_results: limit,
				include_answer: true,
			}),
		});

		if (!res.ok) {
			return { error: `Web search failed (HTTP ${res.status})` };
		}

		const data = (await res.json()) as {
			answer?: string;
			results?: Array<{ title: string; url: string; content: string; score: number }>;
		};

		return {
			answer: data.answer,
			results: (data.results ?? []).map((r) => ({
				title: r.title,
				url: r.url,
				snippet: r.content?.slice(0, 300),
				relevance: r.score,
			})),
		};
	},
});

export const webExtract = tool({
	description:
		"Extract clean text content from a specific URL. Use when someone shares a link and asks about its content.",
	inputSchema: z.object({
		url: z.url().max(2000).describe("URL to extract content from"),
	}),
	execute: async ({ url }) => {
		// Block private/internal URLs to prevent SSRF
		if (!isPublicUrl(url)) {
			return { error: "Only public HTTPS URLs are supported" };
		}

		const apiKey = process.env.TAVILY_API_KEY;
		if (!apiKey) return { error: "TAVILY_API_KEY not configured" };

		const res = await fetch(`${TAVILY_BASE}/extract`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				urls: [url],
			}),
		});

		if (!res.ok) {
			return { error: `Content extraction failed (HTTP ${res.status})` };
		}

		const data = (await res.json()) as {
			results?: Array<{ url: string; raw_content?: string; content?: string }>;
		};
		const result = data.results?.[0];

		if (!result) return { error: "Could not extract content from URL" };

		return {
			url: result.url,
			content: result.raw_content?.slice(0, 15000) ?? result.content?.slice(0, 15000),
			truncated: (result.raw_content?.length ?? 0) > 15000,
		};
	},
});
