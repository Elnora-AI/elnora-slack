/**
 * Auto-generated from Slack OpenAPI spec — files.* methods
 * Run: npm run generate
 */

import type { FilesUploadV2Arguments } from "@slack/web-api";
import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupFilesCommand(program: Command): void {
	const group = program.command("files").description("files.* API methods");

	group
		.command("comments-delete")
		.description("Deletes an existing comment on a file.")
		.option("--file <value>", "File to delete a comment from.")
		.option("--id <value>", "The comment to delete.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.id !== undefined) args["id"] = opts.id;
				const result = await client.apiCall("files.comments.delete", args);
				output(result);
			}),
		);

	group
		.command("delete")
		.description("Deletes a file.")
		.option("--file <value>", "ID of file to delete.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.file !== undefined) args["file"] = opts.file;
				const result = await client.apiCall("files.delete", args);
				output(result);
			}),
		);

	group
		.command("info")
		.description("Gets information about a file.")
		.option("--file <value>", "Specify a file by providing its ID.")
		.option("--count <value>", "count")
		.option("--page <value>", "page")
		.option(
			"--limit <value>",
			"The maximum number of items to return. Fewer than the requested number of items may be returned, even if the end of the list hasn't been reached.",
		)
		.option(
			"--cursor <value>",
			'Parameter for pagination. File comments are paginated for a single file. Set `cursor` equal to the `next_cursor` attribute returned by the previous request\'s `response_metadata`. This parameter is optional, but pagination is mandatory: the default value simply fetches the first "page" of the collection of comments. See [pagination](/docs/pagination) for more details.',
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.count !== undefined) args["count"] = opts.count;
				if (opts.page !== undefined) args["page"] = opts.page;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("files.info", args);
				output(result);
			}),
		);

	group
		.command("list")
		.description("List for a team, in a channel, or from a user with applied filters.")
		.option("--user <value>", "Filter files created by a single user.")
		.option("--channel <value>", "Filter files appearing in a specific channel, indicated by its ID.")
		.option("--ts-from <value>", "Filter files created after this timestamp (inclusive).")
		.option("--ts-to <value>", "Filter files created before this timestamp (inclusive).")
		.option(
			"--types <value>",
			"Filter files by type ([see below](#file_types)). You can pass multiple values in the types argument, like `types=spaces,snippets`.The default value is `all`, which does not filter the list.",
		)
		.option("--count <value>", "count")
		.option("--page <value>", "page")
		.option(
			"--show-files-hidden-by-limit",
			"Show truncated file info for files hidden due to being too old, and the team who owns the file being over the file limit.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.user !== undefined) args["user"] = opts.user;
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.tsFrom !== undefined) args["ts_from"] = opts.tsFrom;
				if (opts.tsTo !== undefined) args["ts_to"] = opts.tsTo;
				if (opts.types !== undefined) args["types"] = opts.types;
				if (opts.count !== undefined) args["count"] = opts.count;
				if (opts.page !== undefined) args["page"] = opts.page;
				if (opts.showFilesHiddenByLimit !== undefined) args["show_files_hidden_by_limit"] = opts.showFilesHiddenByLimit;
				const result = await client.apiCall("files.list", args);
				output(result);
			}),
		);

	group
		.command("remote-add")
		.description("Adds a file from a remote service")
		.option("--external-id <value>", "Creator defined GUID for the file.")
		.option("--title <value>", "Title of the file being shared.")
		.option("--filetype <value>", "type of file")
		.option("--external-url <value>", "URL of the remote file.")
		.option("--preview-image <value>", "Preview of the document via `multipart/form-data`.")
		.option(
			"--indexable-file-contents <value>",
			"A text file (txt, pdf, doc, etc.) containing textual search terms that are used to improve discovery of the remote file.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.externalId !== undefined) args["external_id"] = opts.externalId;
				if (opts.title !== undefined) args["title"] = opts.title;
				if (opts.filetype !== undefined) args["filetype"] = opts.filetype;
				if (opts.externalUrl !== undefined) args["external_url"] = opts.externalUrl;
				if (opts.previewImage !== undefined) args["preview_image"] = opts.previewImage;
				if (opts.indexableFileContents !== undefined) args["indexable_file_contents"] = opts.indexableFileContents;
				const result = await client.apiCall("files.remote.add", args);
				output(result);
			}),
		);

	group
		.command("remote-info")
		.description("Retrieve information about a remote file added to Slack")
		.option("--file <value>", "Specify a file by providing its ID.")
		.option("--external-id <value>", "Creator defined GUID for the file.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.externalId !== undefined) args["external_id"] = opts.externalId;
				const result = await client.apiCall("files.remote.info", args);
				output(result);
			}),
		);

	group
		.command("remote-list")
		.description("Retrieve information about a remote file added to Slack")
		.option("--channel <value>", "Filter files appearing in a specific channel, indicated by its ID.")
		.option("--ts-from <value>", "Filter files created after this timestamp (inclusive).")
		.option("--ts-to <value>", "Filter files created before this timestamp (inclusive).")
		.option("--limit <value>", "The maximum number of items to return.")
		.option(
			"--cursor <value>",
			'Paginate through collections of data by setting the `cursor` parameter to a `next_cursor` attribute returned by a previous request\'s `response_metadata`. Default value fetches the first "page" of the collection. See [pagination](/docs/pagination) for more detail.',
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.tsFrom !== undefined) args["ts_from"] = opts.tsFrom;
				if (opts.tsTo !== undefined) args["ts_to"] = opts.tsTo;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("files.remote.list", args);
				output(result);
			}),
		);

	group
		.command("remote-remove")
		.description("Remove a remote file.")
		.option("--file <value>", "Specify a file by providing its ID.")
		.option("--external-id <value>", "Creator defined GUID for the file.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.externalId !== undefined) args["external_id"] = opts.externalId;
				const result = await client.apiCall("files.remote.remove", args);
				output(result);
			}),
		);

	group
		.command("remote-share")
		.description("Share a remote file into a channel.")
		.option(
			"--file <value>",
			"Specify a file registered with Slack by providing its ID. Either this field or `external_id` or both are required.",
		)
		.option(
			"--external-id <value>",
			"The globally unique identifier (GUID) for the file, as set by the app registering the file with Slack.  Either this field or `file` or both are required.",
		)
		.option("--channels <value>", "Comma-separated list of channel IDs where the file will be shared.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.externalId !== undefined) args["external_id"] = opts.externalId;
				if (opts.channels !== undefined) args["channels"] = opts.channels;
				const result = await client.apiCall("files.remote.share", args);
				output(result);
			}),
		);

	group
		.command("remote-update")
		.description("Updates an existing remote file.")
		.option("--file <value>", "Specify a file by providing its ID.")
		.option("--external-id <value>", "Creator defined GUID for the file.")
		.option("--title <value>", "Title of the file being shared.")
		.option("--filetype <value>", "type of file")
		.option("--external-url <value>", "URL of the remote file.")
		.option("--preview-image <value>", "Preview of the document via `multipart/form-data`.")
		.option(
			"--indexable-file-contents <value>",
			"File containing contents that can be used to improve searchability for the remote file.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.externalId !== undefined) args["external_id"] = opts.externalId;
				if (opts.title !== undefined) args["title"] = opts.title;
				if (opts.filetype !== undefined) args["filetype"] = opts.filetype;
				if (opts.externalUrl !== undefined) args["external_url"] = opts.externalUrl;
				if (opts.previewImage !== undefined) args["preview_image"] = opts.previewImage;
				if (opts.indexableFileContents !== undefined) args["indexable_file_contents"] = opts.indexableFileContents;
				const result = await client.apiCall("files.remote.update", args);
				output(result);
			}),
		);

	group
		.command("revokePublicURL")
		.description("Revokes public/external sharing access for a file")
		.option("--file <value>", "File to revoke")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.file !== undefined) args["file"] = opts.file;
				const result = await client.apiCall("files.revokePublicURL", args);
				output(result);
			}),
		);

	group
		.command("sharedPublicURL")
		.description("Enables a file for public/external sharing.")
		.option("--file <value>", "File to share")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.file !== undefined) args["file"] = opts.file;
				const result = await client.apiCall("files.sharedPublicURL", args);
				output(result);
			}),
		);

	// files.upload was sunset (2025-03) and is unavailable to newly created apps.
	// Every consumer of this repo creates a new app, so upload runs on the
	// @slack/web-api filesUploadV2 helper (files.getUploadURLExternal +
	// files.completeUploadExternal under the hood).
	group
		.command("upload")
		.description("Uploads a file via the files.upload v2 flow (getUploadURLExternal + completeUploadExternal).")
		.option("--file <path>", "Path to a file on disk to upload. Provide this or --content.")
		.option("--content <value>", "Inline file contents as a string. Provide this or --file.")
		.option("--filetype <value>", "A file type identifier.")
		.option("--filename <value>", "Filename of the file.")
		.option("--title <value>", "Title of the file.")
		.option("--initial-comment <value>", "The message text introducing the file in the shared channel.")
		.option(
			"--channels <value>",
			"Channel ID to share the file into. A comma-separated list is accepted for compatibility, but only the first is used — filesUploadV2 shares to a single channel_id.",
		)
		.option(
			"--thread-ts <value>",
			"Provide another message's `ts` value to upload this file as a reply. Never use a reply's `ts` value; use its parent instead.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.file !== undefined) args["file"] = opts.file;
				if (opts.content !== undefined) args["content"] = opts.content;
				if (opts.filetype !== undefined) args["filetype"] = opts.filetype;
				if (opts.filename !== undefined) args["filename"] = opts.filename;
				if (opts.title !== undefined) args["title"] = opts.title;
				if (opts.initialComment !== undefined) args["initial_comment"] = opts.initialComment;
				// filesUploadV2 shares to a single channel_id; take the first entry of a
				// comma-separated --channels value for backward-compatible ergonomics.
				if (opts.channels !== undefined) {
					const first = String(opts.channels).split(",")[0]?.trim();
					if (first) args["channel_id"] = first;
				}
				if (opts.threadTs !== undefined) args["thread_ts"] = opts.threadTs;
				const result = await client.filesUploadV2(args as unknown as FilesUploadV2Arguments);
				output(result);
			}),
		);
}
