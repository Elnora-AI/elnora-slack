import type { ModelMessage } from "ai";
import { describe, expect, it } from "vitest";
import { type Chunk, MIN_CHUNK_MS, runInChunks } from "../agent-run";

const user: ModelMessage[] = [{ role: "user", content: "file an issue for every idea" }];
const toolTurn = (n: number): ModelMessage[] => [
	{
		role: "assistant",
		content: [{ type: "tool-call", toolCallId: `c${n}`, toolName: "linearCreateIssue", input: {} }],
	},
	{
		role: "tool",
		content: [
			{
				type: "tool-result",
				toolCallId: `c${n}`,
				toolName: "linearCreateIssue",
				output: { type: "text", value: "ok" },
			},
		],
	},
];

describe("runInChunks", () => {
	it("resumes a chunk the step cap stopped, from its own tool results, until the agent answers", async () => {
		const seen: number[] = [];
		const chunks: Chunk[] = [
			{
				finishReason: "tool-calls",
				text: "",
				steps: [{ toolCalls: [{ toolName: "linearCreateIssue" }] }],
				response: { messages: toolTurn(1) },
			},
			{
				finishReason: "stop",
				text: "Filed 2 issues.",
				steps: [{ toolCalls: [{ toolName: "linearCreateIssue" }] }],
				response: { messages: [] },
			},
		];
		const outcome = await runInChunks(user, Date.now() + 10 * MIN_CHUNK_MS, async (messages) => {
			seen.push(messages.length);
			return chunks.shift() as Chunk;
		});
		expect(seen).toEqual([1, 3]);
		expect(outcome).toEqual({
			done: true,
			text: "Filed 2 issues.",
			toolNames: ["linearCreateIssue", "linearCreateIssue"],
		});
	});

	it("starts no chunk without time for one, and returns the messages for the next invocation", async () => {
		let t = 0;
		const outcome = await runInChunks(
			user,
			MIN_CHUNK_MS + 1000,
			async () => {
				t = 2000;
				return { finishReason: "tool-calls", text: "", steps: [], response: { messages: toolTurn(1) } };
			},
			() => t,
		);
		expect(outcome.done).toBe(false);
		expect(outcome.done === false && outcome.messages).toEqual([...user, ...toolTurn(1)]);
	});
});
