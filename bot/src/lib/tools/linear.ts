import { LinearClient, PaginationOrderBy } from "@linear/sdk";
import { tool } from "ai";
import { z } from "zod";
import { withRetry } from "../with-retry";

function getClient() {
	const apiKey = process.env.LINEAR_API_KEY;
	if (!apiKey) throw new Error("LINEAR_API_KEY not configured");
	return new LinearClient({ apiKey });
}

export const linearListTeams = tool({
	description:
		"List the workspace's Linear teams with their keys. Use before creating an issue to pick the right teamKey.",
	inputSchema: z.object({}),
	execute: async () => {
		const client = getClient();
		const teams = await client.teams();
		return teams.nodes.map((t) => ({ key: t.key, name: t.name }));
	},
});

export const linearSearchIssues = tool({
	description: "Search Linear issues by keyword. Returns matching issues with state, assignee, and URL.",
	inputSchema: z.object({
		query: z.string().max(500).describe("Search query (e.g. 'audit', 'slack integration')"),
		limit: z.number().optional().default(10).pipe(z.number().max(50)),
	}),
	execute: async ({ query, limit }) => {
		const client = getClient();
		const results = await client.searchIssues(query, { first: limit });
		const issues = await Promise.all(
			results.nodes.map(async (issue) => ({
				id: issue.identifier,
				title: issue.title,
				state: (await issue.state)?.name,
				assignee: (await issue.assignee)?.name,
				priority: issue.priority,
				url: issue.url,
			})),
		);
		return issues;
	},
});

export const linearRecentIssues = tool({
	description:
		"List the most recent Linear issues, sorted by creation or last-update time (newest first). Use for 'latest', 'newest', 'recently updated', or date-scoped issue questions — linearSearchIssues ranks by relevance, not recency. Optionally filter to a date range with since/until.",
	inputSchema: z.object({
		orderBy: z
			.enum(["createdAt", "updatedAt"])
			.optional()
			.default("createdAt")
			.describe("createdAt = newest-created first, updatedAt = most recent activity first"),
		teamKey: z.string().max(10).optional().describe("Restrict to one team key (discover with linearListTeams)"),
		since: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.optional()
			.describe("Only issues with the orderBy timestamp on/after this date (YYYY-MM-DD)"),
		until: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.optional()
			.describe("Only issues with the orderBy timestamp on/before this date (YYYY-MM-DD)"),
		limit: z.number().optional().default(10).pipe(z.number().max(50)),
	}),
	execute: async ({ orderBy, teamKey, since, until, limit }) => {
		const client = getClient();
		// Date bounds apply to whichever timestamp we're ordering by, so "newest
		// updated since Monday" and "created before July" both work.
		const dateField = orderBy === "updatedAt" ? "updatedAt" : "createdAt";
		const dateFilter: Record<string, string> = {};
		if (since) dateFilter.gte = `${since}T00:00:00.000Z`;
		if (until) dateFilter.lte = `${until}T23:59:59.999Z`;
		const filters: Record<string, unknown> = {};
		if (teamKey) filters.team = { key: { eq: teamKey } };
		if (Object.keys(dateFilter).length) filters[dateField] = dateFilter;

		const results = await client.issues({
			first: limit,
			orderBy: orderBy === "updatedAt" ? PaginationOrderBy.UpdatedAt : PaginationOrderBy.CreatedAt,
			...(Object.keys(filters).length ? { filter: filters } : {}),
		});
		return Promise.all(
			results.nodes.map(async (issue) => ({
				id: issue.identifier,
				title: issue.title,
				state: (await issue.state)?.name,
				assignee: (await issue.assignee)?.name,
				createdAt: issue.createdAt,
				updatedAt: issue.updatedAt,
				url: issue.url,
			})),
		);
	},
});

export const linearCreateIssue = tool({
	description:
		"Create a new Linear issue. Defaults to the team's \"To Do\" state, never Backlog. Use linearListTeams first if you don't know the team keys.",
	inputSchema: z.object({
		title: z.string().max(500).describe("Issue title"),
		description: z.string().max(5000).optional().describe("Issue description (markdown)"),
		teamKey: z.string().max(10).describe("Team key (discover with linearListTeams)"),
		priority: z.number().optional().describe("1=urgent, 2=high, 3=medium, 4=low"),
		labelNames: z.array(z.string().max(100)).optional().describe("Label names to apply"),
	}),
	execute: async ({ title, description, teamKey, priority, labelNames }) => {
		const client = getClient();

		// Find team
		const teams = await client.teams();
		const team = teams.nodes.find((t) => t.key === teamKey);
		if (!team) {
			return {
				error: `Team "${teamKey}" not found. Available: ${teams.nodes.map((t) => t.key).join(", ")}`,
			};
		}

		// Find "To Do" state for this team
		const states = await team.states();
		const todoState = states.nodes.find((s) => s.name === "To Do" || s.name === "Todo");

		// Resolve labels if provided
		let labelIds: string[] | undefined;
		if (labelNames?.length) {
			const allLabels = await client.issueLabels();
			labelIds = allLabels.nodes.filter((l) => labelNames.includes(l.name)).map((l) => l.id);
		}

		const result = await client.createIssue({
			teamId: team.id,
			title,
			description,
			priority,
			stateId: todoState?.id,
			labelIds,
		});

		const issue = await result.issue;
		if (!issue) return { error: "Issue creation failed — API returned no issue data" };

		return {
			id: issue.identifier,
			title: issue.title,
			url: issue.url,
			state: todoState?.name ?? "default",
		};
	},
});

async function resolveIssueByIdentifier(client: ReturnType<typeof getClient>, identifier: string) {
	const match = identifier.match(/^([A-Z]+)-(\d+)$/);
	if (!match) return null;
	const [, teamKey, num] = match;
	const issues = await client.issues({
		first: 1,
		filter: { number: { eq: Number.parseInt(num, 10) }, team: { key: { eq: teamKey } } },
	});
	return issues.nodes[0] ?? null;
}

export const linearUpdateIssue = tool({
	description:
		"Update an existing Linear issue by identifier (e.g. ABC-123). Supports state, priority, comments, and parent/child reorganization.",
	inputSchema: z.object({
		issueId: z.string().max(20).describe("Issue identifier (e.g. ABC-123)"),
		title: z.string().max(500).optional(),
		description: z.string().max(5000).optional(),
		stateName: z.string().max(50).optional().describe("State name (e.g. 'In Progress', 'Done', 'To Do')"),
		priority: z.number().optional().describe("1=urgent, 2=high, 3=medium, 4=low"),
		comment: z.string().max(5000).optional().describe("Add a comment to the issue"),
		parentId: z
			.string()
			.max(20)
			.optional()
			.describe("Parent issue identifier. Sets this issue as a child of that parent."),
		removeParent: z.boolean().optional().describe("If true, detach this issue from its current parent (top-level)."),
		childIssueIds: z
			.array(z.string().max(20))
			.max(20)
			.optional()
			.describe("Identifiers of issues to reparent UNDER this issue. Each child gets parentId set to this issue."),
	}),
	execute: async ({
		issueId,
		title,
		description,
		stateName,
		priority,
		comment,
		parentId,
		removeParent,
		childIssueIds,
	}) => {
		const client = getClient();

		const issue = await resolveIssueByIdentifier(client, issueId);
		if (!issue) return { error: `Issue "${issueId}" not found` };

		const updates: Record<string, unknown> = {};
		if (title !== undefined) updates.title = title;
		if (description !== undefined) updates.description = description;
		if (priority !== undefined) updates.priority = priority;

		if (parentId && removeParent) {
			return { error: "parentId and removeParent are mutually exclusive — pick one" };
		}
		if (parentId) {
			const parent = await resolveIssueByIdentifier(client, parentId);
			if (!parent) return { error: `Parent issue "${parentId}" not found` };
			updates.parentId = parent.id;
		}
		if (removeParent) {
			// Linear SDK accepts null to detach. The SDK's typed `parentId` is
			// `string | undefined`, but the GraphQL update mutation accepts null.
			updates.parentId = null;
		}

		// Resolve state name to ID. Loud-fail if no match — silent skips mask
		// spelling mismatches (e.g. "Cancelled" vs Linear's canonical "Canceled").
		// Accept common British/American aliases so an LLM tool call doesn't
		// no-op on a one-letter spelling drift.
		if (stateName) {
			const team = await issue.team;
			if (!team) return { error: `Issue "${issueId}" has no team — cannot resolve state` };
			const states = await team.states();
			const wanted = stateName.toLowerCase().trim();
			const aliases: Record<string, string[]> = {
				cancelled: ["canceled"],
				canceled: ["cancelled"],
				"to do": ["todo"],
				todo: ["to do"],
				"in-progress": ["in progress"],
				"in progress": ["in-progress"],
			};
			const candidates = [wanted, ...(aliases[wanted] ?? [])];
			const state = states.nodes.find((s) => candidates.includes(s.name.toLowerCase()));
			if (!state) {
				const available = states.nodes.map((s) => s.name).join(", ");
				return {
					error: `State "${stateName}" not found in team "${team.name}". Available: ${available}`,
				};
			}
			updates.stateId = state.id;
		}

		// 1) State / metadata update. If THIS fails we abort — nothing else has
		//    changed, so the agent can safely retry the entire tool call.
		if (Object.keys(updates).length > 0) {
			try {
				await withRetry(() => client.updateIssue(issue.id, updates));
			} catch (err) {
				return {
					id: issue.identifier,
					url: issue.url,
					updated: [],
					commentAdded: false,
					error: `state update failed: ${err instanceof Error ? err.message : "unknown"}`,
				};
			}
		}

		// 2) Comment. State has already been mutated. On permanent failure we DO
		//    NOT throw — that would prompt the agent to re-call the tool and
		//    double-apply the state change. Return commentFailed instead.
		let commentAdded = false;
		let commentFailed = false;
		let commentError: string | undefined;
		if (comment) {
			try {
				await withRetry(() => client.createComment({ issueId: issue.id, body: comment }));
				commentAdded = true;
			} catch (err) {
				commentFailed = true;
				commentError = err instanceof Error ? err.message : "unknown";
			}
		}

		// 3) Reparent children (each gets parentId = this issue's UUID).
		//    Per-child try/catch with retry — partial failures are surfaced.
		const reparented: Array<{ id: string; ok: boolean; error?: string }> = [];
		if (childIssueIds?.length) {
			for (const childId of childIssueIds) {
				const child = await resolveIssueByIdentifier(client, childId);
				if (!child) {
					reparented.push({ id: childId, ok: false, error: "not found" });
					continue;
				}
				try {
					await withRetry(() => client.updateIssue(child.id, { parentId: issue.id }));
					reparented.push({ id: childId, ok: true });
				} catch (err) {
					reparented.push({ id: childId, ok: false, error: err instanceof Error ? err.message : "unknown" });
				}
			}
		}

		return {
			id: issue.identifier,
			url: issue.url,
			updated: Object.keys(updates),
			commentAdded,
			...(commentFailed ? { commentFailed: true, commentError } : {}),
			reparented: reparented.length ? reparented : undefined,
		};
	},
});

export const linearMyIssues = tool({
	description:
		"List issues assigned to the Linear API key's user, grouped by state. Use when asked about assigned tasks or what to work on.",
	inputSchema: z.object({
		limit: z.number().optional().default(20).pipe(z.number().max(50)),
	}),
	execute: async ({ limit }) => {
		const client = getClient();
		const me = await client.viewer;
		const assigned = await me.assignedIssues({
			first: limit,
		});

		// Fetch all states in parallel instead of sequential N+1 queries
		const issuesWithState = await Promise.all(
			assigned.nodes.map(async (issue) => ({
				issue,
				stateName: (await issue.state)?.name ?? "Unknown",
			})),
		);

		const grouped: Record<string, Array<{ id: string; title: string; priority: number; url: string }>> = {};
		for (const { issue, stateName } of issuesWithState) {
			if (!grouped[stateName]) grouped[stateName] = [];
			grouped[stateName].push({
				id: issue.identifier,
				title: issue.title,
				priority: issue.priority,
				url: issue.url,
			});
		}

		return grouped;
	},
});
