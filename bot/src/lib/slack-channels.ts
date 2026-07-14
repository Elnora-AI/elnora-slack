/**
 * Slack channel reference → Chat SDK channel ID ("slack:C0XXXXXXX").
 *
 * No channel map is hardcoded. Friendly names resolve through env vars:
 *   SLACK_CHANNEL_<NAME>=C0XXXXXXX   (dashes in the name become underscores)
 * e.g. SLACK_CHANNEL_GENERAL=C012345678 makes "general" resolvable.
 */

function fromEnv(name: string): string | undefined {
	const envKey = `SLACK_CHANNEL_${name.toUpperCase().replace(/-/g, "_")}`;
	return process.env[envKey];
}

/**
 * Accepts:
 *   - "slack:C0XXXXXXX" → passed through
 *   - "C0XXXXXXX"       → prefixed with "slack:"
 *   - "general"          → looked up via SLACK_CHANNEL_GENERAL env var
 */
export function resolveChannelId(input: string): string {
	if (input.startsWith("slack:")) return input;

	// Raw Slack channel ID (starts with C, T, D, or G followed by alphanum)
	if (/^[CTDG][A-Z0-9]{8,}$/.test(input)) return `slack:${input}`;

	const id = fromEnv(input);
	if (id) return `slack:${id}`;

	throw new Error(`Unknown channel "${input}". Use a Slack channel ID (C0XXXXXXX) or set SLACK_CHANNEL_<NAME>.`);
}
