/**
 * Auto-generated from Slack OpenAPI spec — conversations.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupConversationsCommand(program: Command): void {
	const group = program.command("conversations").description("conversations.* API methods");

	group
		.command("archive")
		.description("Archives a conversation.")
		.option("--channel <value>", "ID of conversation to archive")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				const result = await client.apiCall("conversations.archive", args);
				output(result);
			}),
		);

	group
		.command("close")
		.description("Closes a direct message or multi-person direct message.")
		.option("--channel <value>", "Conversation to close.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				const result = await client.apiCall("conversations.close", args);
				output(result);
			}),
		);

	group
		.command("create")
		.description("Initiates a public or private channel-based conversation")
		.option("--name <value>", "Name of the public or private channel to create")
		.option("--is-private", "Create a private channel instead of a public one")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.name !== undefined) args["name"] = opts.name;
				if (opts.isPrivate !== undefined) args["is_private"] = opts.isPrivate;
				const result = await client.apiCall("conversations.create", args);
				output(result);
			}),
		);

	group
		.command("history")
		.description("Fetches a conversation's history of messages and events.")
		.option("--channel <value>", "Conversation ID to fetch history for.")
		.option("--latest <value>", "End of time range of messages to include in results.")
		.option("--oldest <value>", "Start of time range of messages to include in results.")
		.option(
			"--inclusive",
			"Include messages with latest or oldest timestamp in results only when either timestamp is specified.",
		)
		.option(
			"--limit <value>",
			"The maximum number of items to return. Fewer than the requested number of items may be returned, even if the end of the users list hasn't been reached.",
		)
		.option(
			"--cursor <value>",
			'Paginate through collections of data by setting the `cursor` parameter to a `next_cursor` attribute returned by a previous request\'s `response_metadata`. Default value fetches the first "page" of the collection. See [pagination](/docs/pagination) for more detail.',
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.latest !== undefined) args["latest"] = opts.latest;
				if (opts.oldest !== undefined) args["oldest"] = opts.oldest;
				if (opts.inclusive !== undefined) args["inclusive"] = opts.inclusive;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("conversations.history", args);
				output(result);
			}),
		);

	group
		.command("info")
		.description("Retrieve information about a conversation.")
		.option("--channel <value>", "Conversation ID to learn more about")
		.option("--include-locale", "Set this to `true` to receive the locale for this conversation. Defaults to `false`")
		.option(
			"--include-num-members",
			"Set to `true` to include the member count for the specified conversation. Defaults to `false`",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.includeLocale !== undefined) args["include_locale"] = opts.includeLocale;
				if (opts.includeNumMembers !== undefined) args["include_num_members"] = opts.includeNumMembers;
				const result = await client.apiCall("conversations.info", args);
				output(result);
			}),
		);

	group
		.command("invite")
		.description("Invites users to a channel.")
		.option("--channel <value>", "The ID of the public or private channel to invite user(s) to.")
		.option("--users <value>", "A comma separated list of user IDs. Up to 1000 users may be listed.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.users !== undefined) args["users"] = opts.users;
				const result = await client.apiCall("conversations.invite", args);
				output(result);
			}),
		);

	group
		.command("join")
		.description("Joins an existing conversation.")
		.option("--channel <value>", "ID of conversation to join")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				const result = await client.apiCall("conversations.join", args);
				output(result);
			}),
		);

	group
		.command("kick")
		.description("Removes a user from a conversation.")
		.option("--channel <value>", "ID of conversation to remove user from.")
		.option("--user <value>", "User ID to be removed.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.user !== undefined) args["user"] = opts.user;
				const result = await client.apiCall("conversations.kick", args);
				output(result);
			}),
		);

	group
		.command("leave")
		.description("Leaves a conversation.")
		.option("--channel <value>", "Conversation to leave")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				const result = await client.apiCall("conversations.leave", args);
				output(result);
			}),
		);

	group
		.command("list")
		.description("Lists all channels in a Slack team.")
		.option("--exclude-archived", "Set to `true` to exclude archived channels from the list")
		.option(
			"--types <value>",
			"Mix and match channel types by providing a comma-separated list of any combination of `public_channel`, `private_channel`, `mpim`, `im`",
		)
		.option(
			"--limit <value>",
			"The maximum number of items to return. Fewer than the requested number of items may be returned, even if the end of the list hasn't been reached. Must be an integer no larger than 1000.",
		)
		.option(
			"--cursor <value>",
			'Paginate through collections of data by setting the `cursor` parameter to a `next_cursor` attribute returned by a previous request\'s `response_metadata`. Default value fetches the first "page" of the collection. See [pagination](/docs/pagination) for more detail.',
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.excludeArchived !== undefined) args["exclude_archived"] = opts.excludeArchived;
				if (opts.types !== undefined) args["types"] = opts.types;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("conversations.list", args);
				output(result);
			}),
		);

	group
		.command("mark")
		.description("Sets the read cursor in a channel.")
		.option("--channel <value>", "Channel or conversation to set the read cursor for.")
		.option("--ts <value>", "Unique identifier of message you want marked as most recently seen in this conversation.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.ts !== undefined) args["ts"] = opts.ts;
				const result = await client.apiCall("conversations.mark", args);
				output(result);
			}),
		);

	group
		.command("members")
		.description("Retrieve members of a conversation.")
		.option("--channel <value>", "ID of the conversation to retrieve members for")
		.option(
			"--limit <value>",
			"The maximum number of items to return. Fewer than the requested number of items may be returned, even if the end of the users list hasn't been reached.",
		)
		.option(
			"--cursor <value>",
			'Paginate through collections of data by setting the `cursor` parameter to a `next_cursor` attribute returned by a previous request\'s `response_metadata`. Default value fetches the first "page" of the collection. See [pagination](/docs/pagination) for more detail.',
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("conversations.members", args);
				output(result);
			}),
		);

	group
		.command("open")
		.description("Opens or resumes a direct message or multi-person direct message.")
		.option(
			"--channel <value>",
			"Resume a conversation by supplying an `im` or `mpim`'s ID. Or provide the `users` field instead.",
		)
		.option(
			"--users <value>",
			"Comma separated lists of users. If only one user is included, this creates a 1:1 DM.  The ordering of the users is preserved whenever a multi-person direct message is returned. Supply a `channel` when not supplying `users`.",
		)
		.option("--return-im", "Boolean, indicates you want the full IM channel definition in the response.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.users !== undefined) args["users"] = opts.users;
				if (opts.returnIm !== undefined) args["return_im"] = opts.returnIm;
				const result = await client.apiCall("conversations.open", args);
				output(result);
			}),
		);

	group
		.command("rename")
		.description("Renames a conversation.")
		.option("--channel <value>", "ID of conversation to rename")
		.option("--name <value>", "New name for conversation.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.name !== undefined) args["name"] = opts.name;
				const result = await client.apiCall("conversations.rename", args);
				output(result);
			}),
		);

	group
		.command("replies")
		.description("Retrieve a thread of messages posted to a conversation")
		.option("--channel <value>", "Conversation ID to fetch thread from.")
		.option(
			"--ts <value>",
			"Unique identifier of a thread's parent message. `ts` must be the timestamp of an existing message with 0 or more replies. If there are no replies then just the single message referenced by `ts` will return - it is just an ordinary, unthreaded message.",
		)
		.option("--latest <value>", "End of time range of messages to include in results.")
		.option("--oldest <value>", "Start of time range of messages to include in results.")
		.option(
			"--inclusive",
			"Include messages with latest or oldest timestamp in results only when either timestamp is specified.",
		)
		.option(
			"--limit <value>",
			"The maximum number of items to return. Fewer than the requested number of items may be returned, even if the end of the users list hasn't been reached.",
		)
		.option(
			"--cursor <value>",
			'Paginate through collections of data by setting the `cursor` parameter to a `next_cursor` attribute returned by a previous request\'s `response_metadata`. Default value fetches the first "page" of the collection. See [pagination](/docs/pagination) for more detail.',
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.ts !== undefined) args["ts"] = opts.ts;
				if (opts.latest !== undefined) args["latest"] = opts.latest;
				if (opts.oldest !== undefined) args["oldest"] = opts.oldest;
				if (opts.inclusive !== undefined) args["inclusive"] = opts.inclusive;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("conversations.replies", args);
				output(result);
			}),
		);

	group
		.command("setPurpose")
		.description("Sets the purpose for a conversation.")
		.option("--channel <value>", "Conversation to set the purpose of")
		.option("--purpose <value>", "A new, specialer purpose")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.purpose !== undefined) args["purpose"] = opts.purpose;
				const result = await client.apiCall("conversations.setPurpose", args);
				output(result);
			}),
		);

	group
		.command("setTopic")
		.description("Sets the topic for a conversation.")
		.option("--channel <value>", "Conversation to set the topic of")
		.option("--topic <value>", "The new topic string. Does not support formatting or linkification.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.topic !== undefined) args["topic"] = opts.topic;
				const result = await client.apiCall("conversations.setTopic", args);
				output(result);
			}),
		);

	group
		.command("unarchive")
		.description("Reverses conversation archival.")
		.option("--channel <value>", "ID of conversation to unarchive")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				const result = await client.apiCall("conversations.unarchive", args);
				output(result);
			}),
		);
}
