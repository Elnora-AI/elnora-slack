#!/usr/bin/env node
// Publication guard for elnora-slack.
//
// Fails (exit 1) if anything that would leak a private Slack workspace, a real
// credential, or Elnora-internal data has entered the tracked file set:
//
//   1. A populated reference file is tracked (only references/*.template.md may
//      be committed — the real workspace-*.md are gitignored and stay local).
//   2. A real-looking Slack token — a bot/user token (xox[bpars]- with the
//      multi-segment shape), an app-level token (xapp-…), or a refresh token
//      (xoxe.…/xoxe-…).
//   3. A concrete 11-char Slack ID (C0…/U0…/G0…/D0…/W0…/T0…/E0…/B0…) — modern
//      workspace/team/enterprise/bot ids that should never appear outside the
//      fake template rows.
//   4. An @elnora.ai email other than the two allowed OSS contacts.
//
// The official Slack OpenAPI spec (spec/) ships upstream example tokens and ids,
// so it is excluded from the content scans — it is Slack's material, not ours.
//
// Run locally:  node scripts/check-no-populated-references.mjs
// Run in CI:    same; a non-zero exit surfaces the violators.

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SELF = "scripts/check-no-populated-references.mjs";

function trackedFiles() {
	return execSync("git ls-files", { encoding: "utf8" })
		.split("\n")
		.map((s) => s.trim())
		.filter(Boolean);
}

// Patterns are assembled from fragments so this guard file contains no literal
// forbidden string (a repo-wide grep for the raw patterns must not hit here).
const SLACK_TOKEN = new RegExp(
	[
		"xox" + "[bpars]-[0-9A-Za-z]{6,}-[0-9A-Za-z]{6,}",
		"xapp" + "-[0-9A-Za-z-]{10,}",
		"xoxe" + "[.-][0-9A-Za-z-]{10,}",
	].join("|"),
);
const CONCRETE_ID = /\b[CUGWDTEB]0[A-Z0-9]{9}\b/g;
const ELNORA_EMAIL = /([A-Za-z0-9._%+-]+)@elnora\.ai/g;

const ALLOWED_EMAILS = new Set(["opensource@elnora.ai", "security@elnora.ai"]);

// Placeholder ids that are intentionally all-X (e.g. D0XXXXXXXXX) are fine.
const isPlaceholderId = (id) => /^[CUGWDTEB]0X+$/.test(id);

// Files excluded from the content scans (still checked for tracked-ness above).
const isContentExempt = (f) => f === SELF || f.startsWith("spec/");

const files = trackedFiles();
const violations = [];

for (const file of files) {
	// 1. references/: only *.template.md may be committed.
	if (file.startsWith("references/") && file.endsWith(".md") && !file.endsWith(".template.md")) {
		violations.push(`${file}: populated reference file is tracked — only references/*.template.md may be committed`);
	}

	if (isContentExempt(file)) continue;

	let content;
	try {
		content = readFileSync(file, "utf8");
	} catch {
		continue; // unreadable/binary — skip content scan
	}

	// 2. Slack tokens.
	if (SLACK_TOKEN.test(content)) {
		violations.push(`${file}: contains a Slack token (xox…) — credentials must never be committed`);
	}

	// 3. Concrete 11-char Slack ids.
	for (const match of content.match(CONCRETE_ID) ?? []) {
		if (!isPlaceholderId(match)) {
			violations.push(`${file}: contains concrete Slack id "${match}" — use fake template ids (all-zero/all-X) instead`);
		}
	}

	// 4. @elnora.ai emails outside the allow-list.
	for (const [, email] of [...content.matchAll(ELNORA_EMAIL)].map((m) => [m[0], m[0]])) {
		if (!ALLOWED_EMAILS.has(email.toLowerCase())) {
			violations.push(`${file}: contains @elnora.ai email "${email}" — only ${[...ALLOWED_EMAILS].join(", ")} are allowed`);
		}
	}
}

if (violations.length > 0) {
	console.error("Publication guard failed. Do NOT commit the following:\n");
	for (const v of [...new Set(violations)]) console.error(`  - ${v}`);
	console.error(
		"\nReal workspace reference caches live outside the repo (gitignored, or $SLACK_REFERENCES_DIR). " +
			"Credentials belong only in ~/.config/elnora-slack/.env. Strip internal ids and non-OSS emails.",
	);
	process.exit(1);
}

console.log(`Publication guard passed. Scanned ${files.length} tracked files — no tokens, concrete ids, or stray emails.`);
