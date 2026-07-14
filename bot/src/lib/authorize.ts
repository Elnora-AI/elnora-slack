/**
 * Who may talk to the bot.
 *
 * Workspace-wide by default: ALLOWED_SLACK_USER_IDS unset or "*" allows every
 * non-bot member of the workspace the app is installed in (the Slack signing
 * secret already guarantees events only come from YOUR app in YOUR
 * workspace). A CSV of user IDs restricts access to specific people.
 */

export function isAuthorized(userId: string | undefined, allowedCsv = process.env.ALLOWED_SLACK_USER_IDS): boolean {
	if (!userId) return false;
	const raw = (allowedCsv ?? "").trim();
	if (raw === "" || raw === "*") return true;
	const allowed = new Set(
		raw
			.split(",")
			.map((id) => id.trim())
			.filter(Boolean),
	);
	return allowed.has(userId);
}

export const UNAUTHORIZED_MSG =
	"Sorry, I'm not configured to assist you. Ask whoever runs me to add your Slack user ID to ALLOWED_SLACK_USER_IDS.";
