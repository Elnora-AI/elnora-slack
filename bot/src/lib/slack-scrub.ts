/**
 * Strip Slack BROADCAST tokens from text the bot authors. The model can be
 * coaxed (or hallucinate on its own) into emitting `<!channel>` / `<!here>` /
 * `<!everyone>` / `<!subteam^...>`, which would mass-ping the workspace —
 * unacceptable for a bot that anyone in the workspace can talk to.
 *
 * Plain user mentions (`<@U...>`) are left intact: they ping one person and
 * are often legitimately useful in replies.
 *
 * All bounded `[^>]{1,64}` to prevent ReDoS — real Slack tokens are ≤30 chars.
 */

const SLACK_BROADCAST_RE = /<!channel>|<!here>|<!everyone>|<!subteam\^[^>]{1,64}>/g;

export function scrubSlackBroadcasts(text: string): string {
	return text.replace(SLACK_BROADCAST_RE, "").replace(/ {2,}/g, " ");
}
