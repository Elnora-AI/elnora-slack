import { afterEach, describe, expect, it, vi } from "vitest";
import { blogWorkflowConfig, dispatchBlogIdea, splitIdea } from "../blog-idea";

const CONFIGURED: Record<string, string | undefined> = {
	GITHUB_WORKFLOW_TOKEN: "t",
	BLOG_WORKFLOW_REPO: "acme/automation",
	BLOG_WORKFLOW_FILE: "blog.yml",
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("blogWorkflowConfig", () => {
	it("is null until the repo, the file and the token are all set", () => {
		expect(blogWorkflowConfig({})).toBeNull();
		expect(blogWorkflowConfig({ GITHUB_WORKFLOW_TOKEN: "t" })).toBeNull();
		expect(blogWorkflowConfig({ GITHUB_WORKFLOW_TOKEN: "t", BLOG_WORKFLOW_REPO: "acme/automation" })).toBeNull();
	});

	it("defaults the ref to main", () => {
		expect(blogWorkflowConfig(CONFIGURED)?.ref).toBe("main");
	});

	it("does not report back unless the workflow is declared to accept it", () => {
		expect(blogWorkflowConfig(CONFIGURED)?.reportsBack).toBe(false);
		expect(blogWorkflowConfig({ ...CONFIGURED, BLOG_WORKFLOW_REPORTS_BACK: "true" })?.reportsBack).toBe(true);
		expect(blogWorkflowConfig({ ...CONFIGURED, BLOG_WORKFLOW_REPORTS_BACK: "no" })?.reportsBack).toBe(false);
	});

	it("rejects a repo that is not owner/name", () => {
		expect(blogWorkflowConfig({ ...CONFIGURED, BLOG_WORKFLOW_REPO: "automation" })).toBeNull();
		expect(blogWorkflowConfig({ ...CONFIGURED, BLOG_WORKFLOW_REPO: "a/b/c" })).toBeNull();
	});
});

describe("splitIdea", () => {
	it("uses the whole text for both when there is one line", () => {
		expect(splitIdea("Scientists trust Excel")).toEqual({
			heading: "Scientists trust Excel",
			thesis: "Scientists trust Excel",
		});
	});

	it("takes the first line as the heading and strips a markdown prefix", () => {
		expect(splitIdea("## Scientists trust Excel\nYears of watching labs.")).toEqual({
			heading: "Scientists trust Excel",
			thesis: "Years of watching labs.",
		});
	});
});

describe("dispatchBlogIdea", () => {
	it("says it is not configured rather than failing silently", async () => {
		const r = await dispatchBlogIdea("an idea", {});
		expect(r.ok).toBe(false);
		expect(r.message).toContain("BLOG_WORKFLOW_REPO");
	});

	it("refuses empty text without calling GitHub", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const r = await dispatchBlogIdea("   ", CONFIGURED);
		expect(r.ok).toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("posts the idea verbatim to the configured workflow and reports success on 204", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
		vi.stubGlobal("fetch", fetchMock);

		const r = await dispatchBlogIdea("Scientists trust Excel\nBecause they can see it.", CONFIGURED);

		expect(r.ok).toBe(true);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe("https://api.github.com/repos/acme/automation/actions/workflows/blog.yml/dispatches");
		expect(JSON.parse(init.body)).toEqual({
			ref: "main",
			inputs: { idea: "Scientists trust Excel\nBecause they can see it." },
		});
		expect(r.message).toContain("Scientists trust Excel");
	});

	it("keeps the conversation out of the inputs when the workflow cannot take it", async () => {
		// An undeclared workflow_dispatch input is a 422, so a deployment whose
		// workflow predates the report-back contract must dispatch exactly as before.
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
		vi.stubGlobal("fetch", fetchMock);

		const r = await dispatchBlogIdea("an idea", CONFIGURED, { channel: "D123", user: "U9" });

		expect(JSON.parse(fetchMock.mock.calls[0][1].body).inputs).toEqual({ idea: "an idea" });
		expect(r.message).toContain("A pull request appears");
	});

	it("hands the run the conversation, and promises the answer there, once the workflow accepts it", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
		vi.stubGlobal("fetch", fetchMock);
		const env = { ...CONFIGURED, BLOG_WORKFLOW_REPORTS_BACK: "true" };

		const r = await dispatchBlogIdea("an idea", env, { channel: "D123", user: "U9" });

		expect(JSON.parse(fetchMock.mock.calls[0][1].body).inputs).toEqual({
			idea: "an idea",
			slack_channel: "D123",
			slack_user: "U9",
		});
		expect(r.message).toContain("post the pull request here");
	});

	it("falls back to the generic promise when there is no channel to answer in", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
		vi.stubGlobal("fetch", fetchMock);

		const r = await dispatchBlogIdea("an idea", { ...CONFIGURED, BLOG_WORKFLOW_REPORTS_BACK: "true" });

		expect(JSON.parse(fetchMock.mock.calls[0][1].body).inputs).toEqual({ idea: "an idea" });
		expect(r.message).toContain("A pull request appears");
	});

	it("explains a 404 as the workflow not being on the branch yet", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
		const r = await dispatchBlogIdea("an idea", CONFIGURED);
		expect(r.ok).toBe(false);
		expect(r.message).toContain("default branch");
	});

	it("explains a 403 as a token permission problem", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
		const r = await dispatchBlogIdea("an idea", CONFIGURED);
		expect(r.ok).toBe(false);
		expect(r.message).toContain("Actions write");
	});

	it("never leaks the thrown error, which can carry a private repo name", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED api.github.com/repos/acme/secret-repo")),
		);
		const r = await dispatchBlogIdea("an idea", CONFIGURED);
		expect(r.ok).toBe(false);
		expect(r.message).not.toContain("secret-repo");
	});
});
