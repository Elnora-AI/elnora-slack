/**
 * Start a GitHub Actions workflow from an idea typed in Slack.
 *
 * The case this exists for: a writing pipeline that drafts from a thesis a
 * person supplied, rather than one that picks its own topic. An autonomous
 * writer lands on a correct post with no point of view, because nothing in a
 * commit log holds one. So the thesis comes from a person, in Slack, the moment
 * they have the thought, and the research and drafting happen in CI.
 *
 * DELIBERATELY NO MODEL IN THIS PATH. Every other slash command in this bot
 * hands its text to the agent. This one does not: dispatching a workflow is a
 * fixed transformation of the text, and a wrong guess costs a pull request that
 * a person then has to read and close. The text is passed through verbatim.
 *
 * ENABLES WHEN CONFIGURED, like every other optional integration here. Without
 * BLOG_WORKFLOW_REPO and BLOG_WORKFLOW_FILE the command tells the caller it is
 * not set up, and nothing else in the bot changes.
 *
 * THE RUN ANSWERS IN THE SAME CONVERSATION, when the workflow is built to.
 * Dispatching is all this bot can do: the writing happens in CI for many
 * minutes afterwards, so without something at the far end the person who asked
 * gets an acknowledgement and then silence, and never learns whether a pull
 * request appeared. BLOG_WORKFLOW_REPORTS_BACK says the workflow accepts
 * `slack_channel` and `slack_user` inputs and posts the outcome back, and only
 * then are they sent - an input a workflow does not declare is a 422, so a
 * deployment whose workflow predates this keeps working untouched.
 */

const API = "https://api.github.com";

/** Just what this module reads, so a test can pass a plain object. */
type EnvLike = Record<string, string | undefined>;

export interface DispatchResult {
	ok: boolean;
	/** What to say in the channel, already written for a person. */
	message: string;
}

export interface BlogWorkflowConfig {
	token: string;
	/** "owner/repo" holding the workflow. */
	repo: string;
	/** Workflow file name, e.g. "blog-from-ideas.yml". */
	workflow: string;
	/** Branch the workflow is dispatched on. */
	ref: string;
	/**
	 * Whether the workflow takes `slack_channel` / `slack_user` inputs and
	 * reports the outcome back there when it finishes.
	 */
	reportsBack: boolean;
}

/**
 * Null when the deployment has not configured this command. The token is
 * required too: a dispatch without one is a 401 the caller cannot act on.
 */
export function blogWorkflowConfig(env: EnvLike = process.env): BlogWorkflowConfig | null {
	const token = env.GITHUB_WORKFLOW_TOKEN?.trim();
	const repo = env.BLOG_WORKFLOW_REPO?.trim();
	const workflow = env.BLOG_WORKFLOW_FILE?.trim();
	if (!token || !repo || !workflow) return null;
	if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) return null;
	return {
		token,
		repo,
		workflow,
		ref: env.BLOG_WORKFLOW_REF?.trim() || "main",
		reportsBack: /^(1|true|yes)$/i.test(env.BLOG_WORKFLOW_REPORTS_BACK?.trim() ?? ""),
	};
}

/**
 * First line is the heading when there is more than one, otherwise the whole
 * thing is both. Kept exported because the heading is what the caller is shown,
 * and a surprise there is worth a test.
 */
export function splitIdea(text: string): { heading: string; thesis: string } {
	const trimmed = text.trim();
	const nl = trimmed.indexOf("\n");
	const heading = (nl === -1 ? trimmed : trimmed.slice(0, nl)).trim().replace(/^#+\s*/, "");
	const thesis = (nl === -1 ? trimmed : trimmed.slice(nl + 1).trim()) || trimmed;
	return { heading, thesis };
}

/** Trims a heading for display without cutting a word in half. */
function clip(s: string, n: number): string {
	const one = s.replace(/\s+/g, " ").trim();
	if (one.length <= n) return one;
	return `${one.slice(0, n).replace(/\s+\S*$/, "")}…`;
}

/** Where the command was typed, so the finished run can answer there. */
export interface Origin {
	/** Bare Slack channel or DM id (C…/D…/G…). */
	channel?: string | null;
	/** Slack user id of whoever ran the command. */
	user?: string | null;
}

export async function dispatchBlogIdea(
	text: string,
	env: EnvLike = process.env,
	origin: Origin = {},
): Promise<DispatchResult> {
	const config = blogWorkflowConfig(env);
	if (!config) {
		return {
			ok: false,
			message:
				"This command is not configured on this deployment. It needs `BLOG_WORKFLOW_REPO` " +
				"(owner/repo), `BLOG_WORKFLOW_FILE` (the workflow file name) and a " +
				"`GITHUB_WORKFLOW_TOKEN` with Actions write on that repository.",
		};
	}

	const idea = text.trim();
	if (!idea) return { ok: false, message: "Give me the idea and I will start the draft." };

	const { heading } = splitIdea(idea);

	const inputs: Record<string, string> = { idea };
	const answersHere = config.reportsBack && !!origin.channel;
	if (answersHere) {
		inputs.slack_channel = origin.channel as string;
		if (origin.user) inputs.slack_user = origin.user;
	}

	let res: Response;
	try {
		res = await fetch(`${API}/repos/${config.repo}/actions/workflows/${config.workflow}/dispatches`, {
			method: "POST",
			headers: {
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
				"User-Agent": "elnora-slack-bot",
				Authorization: `Bearer ${config.token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ref: config.ref, inputs }),
		});
	} catch (err) {
		// Never surface the raw error: it can carry the URL, and the URL carries
		// the repository name of a private repo.
		console.error("Blog dispatch failed:", err instanceof Error ? err.name : "unknown");
		return { ok: false, message: "Could not reach GitHub to start the draft. Try again in a moment." };
	}

	if (res.status === 204) {
		// Say yes first, then say what happens next. The writing takes minutes,
		// so the acknowledgement has to carry both that the request landed and
		// where the answer will arrive.
		return {
			ok: true,
			message: answersHere
				? `On it, drafting *${clip(heading, 120)}* now. I will post the pull request here when it is written.`
				: `On it, drafting *${clip(heading, 120)}* now. A pull request appears when it is written.`,
		};
	}
	if (res.status === 404) {
		return {
			ok: false,
			message:
				`\`${config.workflow}\` is not on \`${config.ref}\` in \`${config.repo}\`, or the token cannot see it. ` +
				"A workflow only becomes dispatchable once it is on the default branch.",
		};
	}
	if (res.status === 401 || res.status === 403) {
		return { ok: false, message: "The GitHub token was refused. It needs Actions write on that repository." };
	}
	if (res.status === 422) {
		return {
			ok: false,
			message: `\`${config.workflow}\` did not accept the idea. It needs a \`workflow_dispatch\` input named \`idea\`.`,
		};
	}
	console.error(`Blog dispatch unexpected status: ${res.status}`);
	return { ok: false, message: `GitHub answered ${res.status}. Check the workflow and the token.` };
}
