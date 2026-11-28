/** What the bot posts when a run gives no reply text, or stops before it finishes. */

function words(toolName: string): string {
	return toolName.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
}

function summary(toolNames: ReadonlyArray<string>): string {
	const counts = new Map<string, number>();
	for (const name of toolNames) counts.set(name, (counts.get(name) ?? 0) + 1);
	return [...counts].map(([name, n]) => (n > 1 ? `${words(name)} ×${n}` : words(name))).join(", ");
}

export function emptyReplyText(toolNames: ReadonlyArray<string>): string {
	const done = summary(toolNames);
	return done ? `Done, with no written reply. What I did: ${done}.` : "Done, with no written reply.";
}

export function stoppedText(toolNames: ReadonlyArray<string>): string {
	const done = summary(toolNames);
	return (
		"I ran out of time before I finished, so this is not complete." +
		(done ? ` Done so far: ${done}.` : "") +
		" Anything already created (notes, Linear issues) stays; ask me to continue for the rest."
	);
}
