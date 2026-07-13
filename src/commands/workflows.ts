/**
 * Auto-generated from Slack OpenAPI spec — workflows.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupWorkflowsCommand(program: Command): void {
	const group = program.command("workflows").description("workflows.* API methods");

	group
		.command("stepCompleted")
		.description("Indicate that an app's step in a workflow completed execution.")
		.requiredOption(
			"--workflow-step-execute-id <value>",
			"Context identifier that maps to the correct workflow step execution.",
		)
		.option(
			"--outputs <value>",
			"Key-value object of outputs from your step. Keys of this object reflect the configured `key` properties of your [`outputs`](/reference/workflows/workflow_step#output) array from your `workflow_step` object.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.workflowStepExecuteId !== undefined) args["workflow_step_execute_id"] = opts.workflowStepExecuteId;
				if (opts.outputs !== undefined) args["outputs"] = opts.outputs;
				const result = await client.apiCall("workflows.stepCompleted", args);
				output(result);
			}),
		);

	group
		.command("stepFailed")
		.description("Indicate that an app's step in a workflow failed to execute.")
		.requiredOption(
			"--workflow-step-execute-id <value>",
			"Context identifier that maps to the correct workflow step execution.",
		)
		.requiredOption(
			"--error <value>",
			"A JSON-based object with a `message` property that should contain a human readable error message.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.workflowStepExecuteId !== undefined) args["workflow_step_execute_id"] = opts.workflowStepExecuteId;
				if (opts.error !== undefined) args["error"] = opts.error;
				const result = await client.apiCall("workflows.stepFailed", args);
				output(result);
			}),
		);

	group
		.command("updateStep")
		.description("Update the configuration for a workflow extension step.")
		.requiredOption(
			"--workflow-step-edit-id <value>",
			"A context identifier provided with `view_submission` payloads used to call back to `workflows.updateStep`.",
		)
		.option(
			"--inputs <value>",
			"A JSON key-value map of inputs required from a user during configuration. This is the data your app expects to receive when the workflow step starts. **Please note**: the embedded variable format is set and replaced by the workflow system. You cannot create custom variables that will be replaced at runtime. [Read more about variables in workflow steps here](/workflows/steps#variables).",
		)
		.option(
			"--outputs <value>",
			"An JSON array of output objects used during step execution. This is the data your app agrees to provide when your workflow step was executed.",
		)
		.option(
			"--step-name <value>",
			"An optional field that can be used to override the step name that is shown in the Workflow Builder.",
		)
		.option(
			"--step-image-url <value>",
			"An optional field that can be used to override app image that is shown in the Workflow Builder.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.workflowStepEditId !== undefined) args["workflow_step_edit_id"] = opts.workflowStepEditId;
				if (opts.inputs !== undefined) args["inputs"] = opts.inputs;
				if (opts.outputs !== undefined) args["outputs"] = opts.outputs;
				if (opts.stepName !== undefined) args["step_name"] = opts.stepName;
				if (opts.stepImageUrl !== undefined) args["step_image_url"] = opts.stepImageUrl;
				const result = await client.apiCall("workflows.updateStep", args);
				output(result);
			}),
		);
}
