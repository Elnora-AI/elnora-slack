/**
 * What the bot posts when a run ends without reply text. Most often the run hit
 * the step cap mid-task, and a bare "done" there reads as finished work.
 */
type Step = { toolCalls?: ReadonlyArray<{ toolName: string }> };

function words(toolName: string): string {
	return toolName.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
}

export function emptyReplyText(steps: ReadonlyArray<Step>, maxSteps: number): string {
	const counts = new Map<string, number>();
	for (const step of steps) {
		for (const call of step.toolCalls ?? []) counts.set(call.toolName, (counts.get(call.toolName) ?? 0) + 1);
	}
	const done = [...counts].map(([name, n]) => (n > 1 ? `${words(name)} ×${n}` : words(name))).join(", ");
	if (steps.length >= maxSteps) {
		return (
			`I stopped at my ${maxSteps}-step limit before I finished, so this is not complete.` +
			(done ? ` Done so far: ${done}.` : "") +
			" Anything already created (notes, Linear issues) stays; ask me to continue for the rest."
		);
	}
	return done ? `Done, with no written reply. What I did: ${done}.` : "Done, with no written reply.";
}
