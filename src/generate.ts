/**
 * Code generator — reads the Slack OpenAPI spec and produces Commander.js command files.
 *
 * Each top-level API group (chat, conversations, reactions, etc.) becomes one file
 * in src/commands/{group}.ts with subcommands for each method.
 *
 * Hand-authored sections in command files are preserved between
 * `// BEGIN MANUAL` and `// END MANUAL` markers.
 *
 * Usage: npx tsx src/generate.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SpecParam {
	name: string;
	description?: string;
	required?: boolean;
	type?: string;
	in: string;
}

interface SpecMethod {
	description?: string;
	operationId?: string;
	parameters?: SpecParam[];
	externalDocs?: { url?: string };
}

interface SpecPath {
	get?: SpecMethod;
	post?: SpecMethod;
}

// Load spec
const specPath = join(__dirname, "..", "spec", "slack_web_openapi_v2.json");
const spec = JSON.parse(readFileSync(specPath, "utf-8"));

// Group methods by top-level namespace
const groups: Record<
	string,
	Array<{
		apiMethod: string;
		subcommand: string;
		description: string;
		params: SpecParam[];
		docsUrl: string;
	}>
> = {};

for (const [path, methods] of Object.entries(spec.paths as Record<string, SpecPath>)) {
	const apiMethod = path.replace(/^\//, ""); // e.g. "reactions.add"
	const parts = apiMethod.split(".");
	const group = parts[0]; // e.g. "reactions"
	const subcommand = parts.slice(1).join("-"); // e.g. "add" or "ekm-list..."

	if (!subcommand) continue; // Skip bare endpoints like /api.test

	const method = methods.post || methods.get;
	if (!method) continue;

	// Filter out token params — we handle auth globally via env var
	const params = (method.parameters || []).filter((p) => p.in !== "header" && p.name !== "token");

	if (!groups[group]) groups[group] = [];
	groups[group].push({
		apiMethod,
		subcommand,
		description: method.description || `Call ${apiMethod}`,
		params,
		docsUrl: method.externalDocs?.url || `https://api.slack.com/methods/${apiMethod}`,
	});
}

// Generate command file for each group
const commandsDir = join(__dirname, "commands");
mkdirSync(commandsDir, { recursive: true });

function camelCase(s: string): string {
	return s.replace(/[._-](\w)/g, (_, c) => c.toUpperCase());
}

function escapeForSingleQuotedString(s: string): string {
	// Escape backslashes first, then single quotes — order matters to avoid
	// double-escaping the backslash introduced by the quote escape.
	return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function paramFlag(p: SpecParam): string {
	// Convert snake_case param names to kebab-case flags
	const flag = p.name.replace(/_/g, "-");
	if (p.type === "boolean") {
		return `--${flag}`;
	}
	return `--${flag} <value>`;
}

// Params that need validation based on name patterns
const CHANNEL_PARAMS = new Set(["channel", "channel_id"]);
const USER_PARAMS = new Set(["user", "user_id"]);
const TIMESTAMP_PARAMS = new Set(["ts", "timestamp", "thread_ts", "message_ts", "latest_ts", "oldest_ts"]);

// Params that are secrets and should use env var fallback
const SECRET_PARAMS = new Set(["client_secret"]);
const SECRET_ENV_MAP: Record<string, string> = { client_secret: "SLACK_CLIENT_SECRET" };

// API groups whose methods require a user token (bot tokens are rejected by
// Slack with `not_allowed_token_type`). The generated commands pass
// `{ requireUserToken: true }` to `getClient()` so the CLI fails fast with a
// clear error instead of bubbling up an opaque Slack error.
const USER_TOKEN_REQUIRED_GROUPS = new Set(["search"]);

function extractManualSection(filePath: string): string | null {
	if (!existsSync(filePath)) return null;
	const content = readFileSync(filePath, "utf-8");
	const beginMarker = "// BEGIN MANUAL";
	const endMarker = "// END MANUAL";
	const beginIndex = content.indexOf(beginMarker);
	const endIndex = content.indexOf(endMarker);
	if (beginIndex === -1 || endIndex === -1) return null;
	return content.slice(beginIndex, endIndex + endMarker.length);
}

const generatedGroups: Array<{ group: string; setupFn: string; count: number }> = [];

for (const [group, methods] of Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))) {
	const setupFn = `setup${group.charAt(0).toUpperCase() + camelCase(group).slice(1)}Command`;
	const filePath = join(commandsDir, `${group}.ts`);

	// Preserve hand-authored sections
	const manualSection = extractManualSection(filePath);

	let code = `/**
 * Auto-generated from Slack OpenAPI spec — ${group}.* methods
 * Run: npm run generate
 */

import { Command } from "commander";
import { getClient } from "../client.js";
import { output, handleAsyncCommand } from "../output.js";

export function ${setupFn}(program: Command): void {
  const group = program
    .command("${group}")
    .description("${group}.* API methods");
`;

	for (const m of methods.sort((a, b) => a.subcommand.localeCompare(b.subcommand))) {
		const desc = escapeForSingleQuotedString(m.description.replace(/\n/g, " ").trim());
		const nonTokenParams = m.params;

		code += `
  group
    .command("${m.subcommand}")
    .description('${desc}')`;

		for (const p of nonTokenParams) {
			const flag = paramFlag(p);
			const pdesc = escapeForSingleQuotedString((p.description || p.name).replace(/\n/g, " ").trim());
			// Secret params: add env var hint and make optional
			if (SECRET_PARAMS.has(p.name)) {
				const envVar = SECRET_ENV_MAP[p.name] || p.name.toUpperCase();
				code += `
    .option('${flag}', '${pdesc} (or set ${envVar} env var)')`;
			} else if (p.required) {
				code += `
    .requiredOption('${flag}', '${pdesc}')`;
			} else {
				code += `
    .option('${flag}', '${pdesc}')`;
			}
		}

		const clientCall = USER_TOKEN_REQUIRED_GROUPS.has(group) ? "getClient({ requireUserToken: true })" : "getClient()";

		code += `
    .action(handleAsyncCommand(async (opts) => {
      const client = ${clientCall};
      const args: Record<string, unknown> = {};`;

		for (const p of nonTokenParams) {
			// Commander converts --kebab-case to camelCase
			const flagName = camelCase(p.name.replace(/_/g, "-"));

			// Secret params: fall back to env var
			if (SECRET_PARAMS.has(p.name)) {
				const envVar = SECRET_ENV_MAP[p.name] || p.name.toUpperCase();
				code += `
      args["${p.name}"] = opts.${flagName} ?? process.env.${envVar};`;
			} else {
				code += `
      if (opts.${flagName} !== undefined) args["${p.name}"] = opts.${flagName};`;
			}
		}

		// The @slack/web-api apiCall method takes the dot-notation method name
		code += `
      const result = await client.apiCall("${m.apiMethod}", args);
      output(result);
    }));
`;
	}

	// Append manual section if it was preserved
	if (manualSection) {
		code += `
  ${manualSection}
`;
	}

	code += `}
`;

	writeFileSync(filePath, code);
	generatedGroups.push({ group, setupFn, count: methods.length });
	console.log(`  ${group}: ${methods.length} methods -> commands/${group}.ts`);
}

// Generate commands/index.ts that registers all groups
// Include manually-maintained files that aren't in the spec
const manualGroups = ["bookmarks", "canvases", "completion", "functions", "slackLists"];

let indexCode = `/**
 * Auto-generated command registry — registers all API groups.
 * Run: npm run generate
 */

import { Command } from "commander";

`;

const sortedGroups = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
const allGroupNames = new Set(sortedGroups.map(([g]) => g));
for (const mg of manualGroups) allGroupNames.add(mg);

const sortedAllGroups = [...allGroupNames].sort();
for (const group of sortedAllGroups) {
	const fn =
		group === "slackLists"
			? "setupSlackListsCommand"
			: `setup${group.charAt(0).toUpperCase() + camelCase(group).slice(1)}Command`;
	const file = group === "slackLists" ? "slackLists" : group;
	indexCode += `import { ${fn} } from "./${file}.js";\n`;
}

indexCode += `
export function registerAllCommands(program: Command): void {
`;
for (const group of sortedAllGroups) {
	const fn =
		group === "slackLists"
			? "setupSlackListsCommand"
			: `setup${group.charAt(0).toUpperCase() + camelCase(group).slice(1)}Command`;
	indexCode += `  ${fn}(program);\n`;
}
indexCode += `}
`;

writeFileSync(join(commandsDir, "index.ts"), indexCode);

console.log(
	`\nGenerated ${sortedGroups.length} command groups covering ${Object.values(groups).reduce((sum, g) => sum + g.length, 0)} methods.`,
);
