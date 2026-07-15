/**
 * Tool registry — every tool group is enabled purely by the presence of its
 * environment variables. Nothing is hardcoded to any one org; deployments
 * light up capabilities by setting keys.
 *
 * Naming convention: {service}{Action} (e.g. linearSearchIssues, gmailDraft).
 */

import type { ToolSet } from "ai";
import * as admin from "./admin";
import * as calendar from "./calendar";
import * as gmail from "./gmail";
import * as kb from "./knowledge-base";
import * as linear from "./linear";
import * as slack from "./slack";
import * as webProviders from "./web-providers";
import * as web from "./web-search";

export interface ToolGroup {
	key: string;
	label: string;
	/** One-line capability description injected into the system prompt when enabled */
	promptHint: string;
	enabled: boolean;
	tools: ToolSet;
}

function hasGoogleOAuth(): boolean {
	return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

const KB_NAME = () => process.env.KB_NAME?.trim() || "knowledge base";

/**
 * Compute the tool groups from the current environment. Called at agent
 * construction (cold start) — and directly by tests.
 */
export function toolGroups(): ToolGroup[] {
	const kbReadEnabled =
		hasGoogleOAuth() &&
		!!(process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN) &&
		!!process.env.DRIVE_ID;
	const kbTools: ToolSet = process.env.NOTES_FOLDER_ID
		? {
				kbSearch: kb.kbSearch,
				kbRecentNotes: kb.kbRecentNotes,
				kbReadFile: kb.kbReadFile,
				kbCreateNote: kb.kbCreateNote,
			}
		: { kbSearch: kb.kbSearch, kbRecentNotes: kb.kbRecentNotes, kbReadFile: kb.kbReadFile };

	return [
		{
			key: "knowledge-base",
			label: "Knowledge base",
			promptHint: `Search and read the ${KB_NAME()} (\`kbSearch\`, \`kbReadFile\`${process.env.NOTES_FOLDER_ID ? ", save notes with `kbCreateNote`" : ""}). This is the default place to look for internal docs, policies, templates, and procedures. For "latest/newest note" or date-scoped questions use \`kbRecentNotes\` (recency-ordered) — \`kbSearch\` ranks by keyword relevance, not recency, though it also accepts sort='newest' and date filters.`,
			enabled: kbReadEnabled,
			tools: kbTools,
		},
		{
			key: "linear",
			label: "Linear",
			promptHint:
				"Create, update, and search Linear issues (`linear*`). Use `linearListTeams` to discover team keys before creating. For latest/newest/recent issues use `linearRecentIssues` (sorted by recency) — `linearSearchIssues` ranks by relevance, not recency. New issues default to the team's To Do state.",
			enabled: !!process.env.LINEAR_API_KEY,
			tools: { ...linear },
		},
		{
			key: "gmail",
			label: "Gmail",
			promptHint:
				"Search email, create drafts, read threads (`gmail*`). Drafts are never sent without explicit approval.",
			enabled: hasGoogleOAuth() && !!process.env.GOOGLE_REFRESH_TOKEN,
			tools: { ...gmail },
		},
		{
			key: "calendar",
			label: "Calendar",
			promptHint:
				"List and create Google Calendar events (`calendar*`). Events with attendees require approval. Present times exactly as returned — never convert timezones.",
			enabled: hasGoogleOAuth() && !!process.env.GOOGLE_REFRESH_TOKEN,
			tools: { ...calendar },
		},
		{
			key: "slack-search",
			label: "Slack search",
			promptHint:
				"Search past Slack messages across channels and DMs (`slackSearchMessages`). Use to find previous conversations.",
			enabled: !!process.env.SLACK_USER_TOKEN,
			tools: { ...slack },
		},
		{
			key: "web-search",
			label: "Web search (Tavily)",
			promptHint:
				"Search the web and extract page content (`webSearch`, `webExtract`) for current information not in internal sources.",
			enabled: !!process.env.TAVILY_API_KEY,
			tools: { ...web },
		},
		{
			key: "exa",
			label: "Exa search",
			promptHint: "Neural web search by meaning (`exaSearch`) — finds relevant pages, companies, papers, people.",
			enabled: !!process.env.EXA_API_KEY,
			tools: { exaSearch: webProviders.exaSearch },
		},
		{
			key: "perplexity",
			label: "Perplexity",
			promptHint: "Web-grounded answers with citations (`perplexityAsk`) for current facts that need sourcing.",
			enabled: !!process.env.PERPLEXITY_API_KEY,
			tools: { perplexityAsk: webProviders.perplexityAsk },
		},
		{
			key: "valyu",
			label: "Valyu",
			promptHint: "Citations-grade research search (`valyuSearch`) — academic, financial/SEC, clinical/biomedical.",
			enabled: !!process.env.VALYU_API_KEY,
			tools: { valyuSearch: webProviders.valyuSearch },
		},
		{
			key: "system",
			label: "System",
			promptHint: "Help and connectivity status (`help`, `systemStatus`).",
			enabled: true,
			tools: { ...admin },
		},
	];
}

/** Merge all enabled groups into the flat ToolSet the agent consumes. */
export function buildTools(): ToolSet {
	const merged: ToolSet = {};
	for (const group of toolGroups()) {
		if (!group.enabled) continue;
		Object.assign(merged, group.tools);
	}
	return merged;
}
