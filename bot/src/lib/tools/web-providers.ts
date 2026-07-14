import { tool } from "ai";
import { z } from "zod";

/**
 * Additional web-search / answer providers, each enabled by its own API key:
 *   EXA_API_KEY        → exaSearch     (neural web search)
 *   PERPLEXITY_API_KEY → perplexityAsk (web-grounded answer with citations)
 *   VALYU_API_KEY      → valyuSearch   (knowledge/academic/financial search)
 *
 * These sit alongside the Tavily tools in web-search.ts. All are best-effort:
 * a non-OK response returns a structured error rather than throwing.
 */

export const exaSearch = tool({
	description:
		"Neural web search via Exa. Use for finding relevant pages, companies, papers, or people by meaning, not just keywords.",
	inputSchema: z.object({
		query: z.string().max(500).describe("Search query"),
		limit: z.number().optional().default(5).pipe(z.number().max(15)),
	}),
	execute: async ({ query, limit }) => {
		const apiKey = process.env.EXA_API_KEY;
		if (!apiKey) return { error: "EXA_API_KEY not configured" };
		const res = await fetch("https://api.exa.ai/search", {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-api-key": apiKey },
			body: JSON.stringify({ query, numResults: limit, contents: { text: { maxCharacters: 800 } } }),
		});
		if (!res.ok) return { error: `Exa search failed (HTTP ${res.status})` };
		const data = (await res.json()) as {
			results?: Array<{ title?: string; url?: string; text?: string; score?: number }>;
		};
		return {
			results: (data.results ?? []).map((r) => ({
				title: r.title,
				url: r.url,
				snippet: r.text?.slice(0, 400),
				relevance: r.score,
			})),
		};
	},
});

export const perplexityAsk = tool({
	description:
		"Ask Perplexity a question and get a web-grounded answer with source citations. Use for current facts that need up-to-date sourcing.",
	inputSchema: z.object({
		query: z.string().max(1000).describe("The question to answer"),
		model: z.string().max(60).optional().describe("Perplexity model (default sonar)"),
	}),
	execute: async ({ query, model }) => {
		const apiKey = process.env.PERPLEXITY_API_KEY;
		if (!apiKey) return { error: "PERPLEXITY_API_KEY not configured" };
		const res = await fetch("https://api.perplexity.ai/chat/completions", {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
			body: JSON.stringify({
				model: model?.trim() || "sonar",
				messages: [{ role: "user", content: query }],
			}),
		});
		if (!res.ok) return { error: `Perplexity failed (HTTP ${res.status})` };
		const data = (await res.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
			citations?: string[];
		};
		return {
			answer: data.choices?.[0]?.message?.content,
			citations: (data.citations ?? []).slice(0, 10),
		};
	},
});

export const valyuSearch = tool({
	description:
		"Search Valyu for grounded knowledge — academic papers, financial/SEC data, clinical/biomedical sources. Use for citations-grade research.",
	inputSchema: z.object({
		query: z.string().max(500).describe("Search query"),
		limit: z.number().optional().default(5).pipe(z.number().max(15)),
	}),
	execute: async ({ query, limit }) => {
		const apiKey = process.env.VALYU_API_KEY;
		if (!apiKey) return { error: "VALYU_API_KEY not configured" };
		const res = await fetch("https://api.valyu.network/v1/deepsearch", {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-api-key": apiKey },
			body: JSON.stringify({ query, search_type: "all", max_num_results: limit }),
		});
		if (!res.ok) return { error: `Valyu search failed (HTTP ${res.status})` };
		const data = (await res.json()) as {
			results?: Array<{ title?: string; url?: string; content?: string; source?: string }>;
		};
		return {
			results: (data.results ?? []).map((r) => ({
				title: r.title,
				url: r.url,
				source: r.source,
				snippet: (r.content ?? "").slice(0, 400),
			})),
		};
	},
});
