/**
 * Auto-generated from Slack OpenAPI spec — chat.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupChatCommand(program: Command): void {
	const group = program.command("chat").description("chat.* API methods");

	group
		.command("delete")
		.description("Deletes a message.")
		.option("--ts <value>", "Timestamp of the message to be deleted.")
		.option("--channel <value>", "Channel containing the message to be deleted.")
		.option(
			"--as-user",
			"Pass true to delete the message as the authed user with `chat:write:user` scope. [Bot users](/bot-users) in this context are considered authed users. If unused or false, the message will be deleted with `chat:write:bot` scope.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.ts !== undefined) args["ts"] = opts.ts;
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.asUser !== undefined) args["as_user"] = opts.asUser;
				const result = await client.apiCall("chat.delete", args);
				output(result);
			}),
		);

	group
		.command("deleteScheduledMessage")
		.description("Deletes a pending scheduled message from the queue.")
		.option(
			"--as-user",
			"Pass true to delete the message as the authed user with `chat:write:user` scope. [Bot users](/bot-users) in this context are considered authed users. If unused or false, the message will be deleted with `chat:write:bot` scope.",
		)
		.requiredOption("--channel <value>", "The channel the scheduled_message is posting to")
		.requiredOption(
			"--scheduled-message-id <value>",
			"`scheduled_message_id` returned from call to chat.scheduleMessage",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.asUser !== undefined) args["as_user"] = opts.asUser;
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.scheduledMessageId !== undefined) args["scheduled_message_id"] = opts.scheduledMessageId;
				const result = await client.apiCall("chat.deleteScheduledMessage", args);
				output(result);
			}),
		);

	group
		.command("getPermalink")
		.description("Retrieve a permalink URL for a specific extant message")
		.requiredOption("--channel <value>", "The ID of the conversation or channel containing the message")
		.requiredOption("--message-ts <value>", "A message's `ts` value, uniquely identifying it within a channel")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.messageTs !== undefined) args["message_ts"] = opts.messageTs;
				const result = await client.apiCall("chat.getPermalink", args);
				output(result);
			}),
		);

	group
		.command("meMessage")
		.description("Share a me message into a channel.")
		.option(
			"--channel <value>",
			"Channel to send message to. Can be a public channel, private group or IM channel. Can be an encoded ID, or a name.",
		)
		.option("--text <value>", "Text of the message to send.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.text !== undefined) args["text"] = opts.text;
				const result = await client.apiCall("chat.meMessage", args);
				output(result);
			}),
		);

	group
		.command("postEphemeral")
		.description("Sends an ephemeral message to a user in a channel.")
		.option(
			"--as-user",
			"Pass true to post the message as the authed user. Defaults to true if the chat:write:bot scope is not included. Otherwise, defaults to false.",
		)
		.option("--attachments <value>", "A JSON-based array of structured attachments, presented as a URL-encoded string.")
		.option("--blocks <value>", "A JSON-based array of structured blocks, presented as a URL-encoded string.")
		.requiredOption(
			"--channel <value>",
			"Channel, private group, or IM channel to send message to. Can be an encoded ID, or a name.",
		)
		.option(
			"--icon-emoji <value>",
			"Emoji to use as the icon for this message. Overrides `icon_url`. Must be used in conjunction with `as_user` set to `false`, otherwise ignored. See [authorship](#authorship) below.",
		)
		.option(
			"--icon-url <value>",
			"URL to an image to use as the icon for this message. Must be used in conjunction with `as_user` set to false, otherwise ignored. See [authorship](#authorship) below.",
		)
		.option("--link-names", "Find and link channel names and usernames.")
		.option("--parse <value>", "Change how messages are treated. Defaults to `none`. See [below](#formatting).")
		.option(
			"--text <value>",
			"How this field works and whether it is required depends on other fields you use in your API call. [See below](#text_usage) for more detail.",
		)
		.option(
			"--thread-ts <value>",
			"Provide another message's `ts` value to post this message in a thread. Avoid using a reply's `ts` value; use its parent's value instead. Ephemeral messages in threads are only shown if there is already an active thread.",
		)
		.requiredOption(
			"--user <value>",
			"`id` of the user who will receive the ephemeral message. The user should be in the channel specified by the `channel` argument.",
		)
		.option(
			"--username <value>",
			"Set your bot's user name. Must be used in conjunction with `as_user` set to false, otherwise ignored. See [authorship](#authorship) below.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.asUser !== undefined) args["as_user"] = opts.asUser;
				if (opts.attachments !== undefined) args["attachments"] = opts.attachments;
				if (opts.blocks !== undefined) args["blocks"] = opts.blocks;
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.iconEmoji !== undefined) args["icon_emoji"] = opts.iconEmoji;
				if (opts.iconUrl !== undefined) args["icon_url"] = opts.iconUrl;
				if (opts.linkNames !== undefined) args["link_names"] = opts.linkNames;
				if (opts.parse !== undefined) args["parse"] = opts.parse;
				if (opts.text !== undefined) args["text"] = opts.text;
				if (opts.threadTs !== undefined) args["thread_ts"] = opts.threadTs;
				if (opts.user !== undefined) args["user"] = opts.user;
				if (opts.username !== undefined) args["username"] = opts.username;
				const result = await client.apiCall("chat.postEphemeral", args);
				output(result);
			}),
		);

	group
		.command("postMessage")
		.description("Sends a message to a channel.")
		.option(
			"--as-user <value>",
			"Pass true to post the message as the authed user, instead of as a bot. Defaults to false. See [authorship](#authorship) below.",
		)
		.option("--attachments <value>", "A JSON-based array of structured attachments, presented as a URL-encoded string.")
		.option("--blocks <value>", "A JSON-based array of structured blocks, presented as a URL-encoded string.")
		.requiredOption(
			"--channel <value>",
			"Channel, private group, or IM channel to send message to. Can be an encoded ID, or a name. See [below](#channels) for more details.",
		)
		.option(
			"--icon-emoji <value>",
			"Emoji to use as the icon for this message. Overrides `icon_url`. Must be used in conjunction with `as_user` set to `false`, otherwise ignored. See [authorship](#authorship) below.",
		)
		.option(
			"--icon-url <value>",
			"URL to an image to use as the icon for this message. Must be used in conjunction with `as_user` set to false, otherwise ignored. See [authorship](#authorship) below.",
		)
		.option("--link-names", "Find and link channel names and usernames.")
		.option("--mrkdwn", "Disable Slack markup parsing by setting to `false`. Enabled by default.")
		.option("--parse <value>", "Change how messages are treated. Defaults to `none`. See [below](#formatting).")
		.option(
			"--reply-broadcast",
			"Used in conjunction with `thread_ts` and indicates whether reply should be made visible to everyone in the channel or conversation. Defaults to `false`.",
		)
		.option(
			"--text <value>",
			"How this field works and whether it is required depends on other fields you use in your API call. [See below](#text_usage) for more detail.",
		)
		.option(
			"--thread-ts <value>",
			"Provide another message's `ts` value to make this message a reply. Avoid using a reply's `ts` value; use its parent instead.",
		)
		.option("--unfurl-links", "Pass true to enable unfurling of primarily text-based content.")
		.option("--unfurl-media", "Pass false to disable unfurling of media content.")
		.option(
			"--username <value>",
			"Set your bot's user name. Must be used in conjunction with `as_user` set to false, otherwise ignored. See [authorship](#authorship) below.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.asUser !== undefined) args["as_user"] = opts.asUser;
				if (opts.attachments !== undefined) args["attachments"] = opts.attachments;
				if (opts.blocks !== undefined) args["blocks"] = opts.blocks;
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.iconEmoji !== undefined) args["icon_emoji"] = opts.iconEmoji;
				if (opts.iconUrl !== undefined) args["icon_url"] = opts.iconUrl;
				if (opts.linkNames !== undefined) args["link_names"] = opts.linkNames;
				if (opts.mrkdwn !== undefined) args["mrkdwn"] = opts.mrkdwn;
				if (opts.parse !== undefined) args["parse"] = opts.parse;
				if (opts.replyBroadcast !== undefined) args["reply_broadcast"] = opts.replyBroadcast;
				if (opts.text !== undefined) args["text"] = opts.text;
				if (opts.threadTs !== undefined) args["thread_ts"] = opts.threadTs;
				if (opts.unfurlLinks !== undefined) args["unfurl_links"] = opts.unfurlLinks;
				if (opts.unfurlMedia !== undefined) args["unfurl_media"] = opts.unfurlMedia;
				if (opts.username !== undefined) args["username"] = opts.username;
				const result = await client.apiCall("chat.postMessage", args);
				output(result);
			}),
		);

	group
		.command("scheduledMessages-list")
		.description("Returns a list of scheduled messages.")
		.option("--channel <value>", "The channel of the scheduled messages")
		.option("--latest <value>", "A UNIX timestamp of the latest value in the time range")
		.option("--oldest <value>", "A UNIX timestamp of the oldest value in the time range")
		.option("--limit <value>", "Maximum number of original entries to return.")
		.option(
			"--cursor <value>",
			"For pagination purposes, this is the `cursor` value returned from a previous call to `chat.scheduledmessages.list` indicating where you want to start this call from.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.latest !== undefined) args["latest"] = opts.latest;
				if (opts.oldest !== undefined) args["oldest"] = opts.oldest;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("chat.scheduledMessages.list", args);
				output(result);
			}),
		);

	group
		.command("scheduleMessage")
		.description("Schedules a message to be sent to a channel.")
		.option(
			"--channel <value>",
			"Channel, private group, or DM channel to send message to. Can be an encoded ID, or a name. See [below](#channels) for more details.",
		)
		.option(
			"--text <value>",
			"How this field works and whether it is required depends on other fields you use in your API call. [See below](#text_usage) for more detail.",
		)
		.option("--post-at <value>", "Unix EPOCH timestamp of time in future to send the message.")
		.option(
			"--parse <value>",
			"Change how messages are treated. Defaults to `none`. See [chat.postMessage](chat.postMessage#formatting).",
		)
		.option(
			"--as-user",
			"Pass true to post the message as the authed user, instead of as a bot. Defaults to false. See [chat.postMessage](chat.postMessage#authorship).",
		)
		.option("--link-names", "Find and link channel names and usernames.")
		.option("--attachments <value>", "A JSON-based array of structured attachments, presented as a URL-encoded string.")
		.option("--blocks <value>", "A JSON-based array of structured blocks, presented as a URL-encoded string.")
		.option("--unfurl-links", "Pass true to enable unfurling of primarily text-based content.")
		.option("--unfurl-media", "Pass false to disable unfurling of media content.")
		.option(
			"--thread-ts <value>",
			"Provide another message's `ts` value to make this message a reply. Avoid using a reply's `ts` value; use its parent instead.",
		)
		.option(
			"--reply-broadcast",
			"Used in conjunction with `thread_ts` and indicates whether reply should be made visible to everyone in the channel or conversation. Defaults to `false`.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.text !== undefined) args["text"] = opts.text;
				if (opts.postAt !== undefined) args["post_at"] = opts.postAt;
				if (opts.parse !== undefined) args["parse"] = opts.parse;
				if (opts.asUser !== undefined) args["as_user"] = opts.asUser;
				if (opts.linkNames !== undefined) args["link_names"] = opts.linkNames;
				if (opts.attachments !== undefined) args["attachments"] = opts.attachments;
				if (opts.blocks !== undefined) args["blocks"] = opts.blocks;
				if (opts.unfurlLinks !== undefined) args["unfurl_links"] = opts.unfurlLinks;
				if (opts.unfurlMedia !== undefined) args["unfurl_media"] = opts.unfurlMedia;
				if (opts.threadTs !== undefined) args["thread_ts"] = opts.threadTs;
				if (opts.replyBroadcast !== undefined) args["reply_broadcast"] = opts.replyBroadcast;
				const result = await client.apiCall("chat.scheduleMessage", args);
				output(result);
			}),
		);

	group
		.command("unfurl")
		.description("Provide custom unfurl behavior for user-posted URLs")
		.requiredOption("--channel <value>", "Channel ID of the message")
		.requiredOption("--ts <value>", "Timestamp of the message to add unfurl behavior to.")
		.option(
			"--unfurls <value>",
			"URL-encoded JSON map with keys set to URLs featured in the the message, pointing to their unfurl blocks or message attachments.",
		)
		.option(
			"--user-auth-message <value>",
			"Provide a simply-formatted string to send as an ephemeral message to the user as invitation to authenticate further and enable full unfurling behavior",
		)
		.option(
			"--user-auth-required",
			"Set to `true` or `1` to indicate the user must install your Slack app to trigger unfurls for this domain",
		)
		.option(
			"--user-auth-url <value>",
			"Send users to this custom URL where they will complete authentication in your app to fully trigger unfurling. Value should be properly URL-encoded.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.ts !== undefined) args["ts"] = opts.ts;
				if (opts.unfurls !== undefined) args["unfurls"] = opts.unfurls;
				if (opts.userAuthMessage !== undefined) args["user_auth_message"] = opts.userAuthMessage;
				if (opts.userAuthRequired !== undefined) args["user_auth_required"] = opts.userAuthRequired;
				if (opts.userAuthUrl !== undefined) args["user_auth_url"] = opts.userAuthUrl;
				const result = await client.apiCall("chat.unfurl", args);
				output(result);
			}),
		);

	group
		.command("update")
		.description("Updates a message.")
		.option(
			"--as-user <value>",
			"Pass true to update the message as the authed user. [Bot users](/bot-users) in this context are considered authed users.",
		)
		.option(
			"--attachments <value>",
			"A JSON-based array of structured attachments, presented as a URL-encoded string. This field is required when not presenting `text`. If you don't include this field, the message's previous `attachments` will be retained. To remove previous `attachments`, include an empty array for this field.",
		)
		.option(
			"--blocks <value>",
			"A JSON-based array of [structured blocks](/block-kit/building), presented as a URL-encoded string. If you don't include this field, the message's previous `blocks` will be retained. To remove previous `blocks`, include an empty array for this field.",
		)
		.requiredOption("--channel <value>", "Channel containing the message to be updated.")
		.option(
			"--link-names <value>",
			"Find and link channel names and usernames. Defaults to `none`. If you do not specify a value for this field, the original value set for the message will be overwritten with the default, `none`.",
		)
		.option(
			"--parse <value>",
			"Change how messages are treated. Defaults to `client`, unlike `chat.postMessage`. Accepts either `none` or `full`. If you do not specify a value for this field, the original value set for the message will be overwritten with the default, `client`.",
		)
		.option(
			"--text <value>",
			"New text for the message, using the [default formatting rules](/reference/surfaces/formatting). It's not required when presenting `blocks` or `attachments`.",
		)
		.requiredOption("--ts <value>", "Timestamp of the message to be updated.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.asUser !== undefined) args["as_user"] = opts.asUser;
				if (opts.attachments !== undefined) args["attachments"] = opts.attachments;
				if (opts.blocks !== undefined) args["blocks"] = opts.blocks;
				if (opts.channel !== undefined) args["channel"] = opts.channel;
				if (opts.linkNames !== undefined) args["link_names"] = opts.linkNames;
				if (opts.parse !== undefined) args["parse"] = opts.parse;
				if (opts.text !== undefined) args["text"] = opts.text;
				if (opts.ts !== undefined) args["ts"] = opts.ts;
				const result = await client.apiCall("chat.update", args);
				output(result);
			}),
		);
}
