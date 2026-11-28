import type { ModelMessage } from "ai";

/**
 * A big request ("file an issue for every idea in this paper") needs more tool
 * steps than one agent call allows. MAX_STEPS bounds one chunk, not the
 * request: a chunk that stops on the cap with tool calls still pending is
 * resumed from its own messages, tool results included, until the agent
 * answers or this invocation runs short of time. The caller then hands the
 * remaining messages to a fresh invocation (see continueAgentRun in bot.ts).
 */

/** Below this much of the invocation's budget, start no new chunk: hand the run on instead. */
export const MIN_CHUNK_MS = 300_000;

type Step = { toolCalls?: ReadonlyArray<{ toolName: string }> };

export interface Chunk {
	finishReason: string;
	text: string;
	steps: ReadonlyArray<Step>;
	response: { messages: ReadonlyArray<ModelMessage> };
}

export type RunOutcome =
	| { done: true; text: string; toolNames: string[] }
	| { done: false; messages: ModelMessage[]; toolNames: string[] };

export async function runInChunks(
	messages: ModelMessage[],
	deadline: number,
	generate: (messages: ModelMessage[], timeoutMs: number) => Promise<Chunk>,
	now: () => number = Date.now,
): Promise<RunOutcome> {
	let history = messages;
	const toolNames: string[] = [];
	for (;;) {
		const remaining = deadline - now();
		if (remaining < MIN_CHUNK_MS) return { done: false, messages: history, toolNames };
		const chunk = await generate(history, remaining);
		for (const step of chunk.steps) for (const call of step.toolCalls ?? []) toolNames.push(call.toolName);
		// "tool-calls" as the final reason means the step cap stopped a run that wanted more tools.
		if (chunk.finishReason !== "tool-calls") return { done: true, text: chunk.text, toolNames };
		history = [...history, ...chunk.response.messages];
	}
}
