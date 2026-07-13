/**
 * Auto-generated from Slack OpenAPI spec — admin.* methods
 * Run: npm run generate
 */

import type { Command } from "commander";
import { getClient } from "../client.js";
import { handleAsyncCommand, output } from "../output.js";

export function setupAdminCommand(program: Command): void {
	const group = program.command("admin").description("admin.* API methods");

	group
		.command("apps-approve")
		.description("Approve an app for installation on a workspace.")
		.option("--app-id <value>", "The id of the app to approve.")
		.option("--request-id <value>", "The id of the request to approve.")
		.option("--team-id <value>", "team_id")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.appId !== undefined) args["app_id"] = opts.appId;
				if (opts.requestId !== undefined) args["request_id"] = opts.requestId;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				const result = await client.apiCall("admin.apps.approve", args);
				output(result);
			}),
		);

	group
		.command("apps-approved-list")
		.description("List approved apps for an org or workspace.")
		.option("--limit <value>", "The maximum number of items to return. Must be between 1 - 1000 both inclusive.")
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page",
		)
		.option("--team-id <value>", "team_id")
		.option("--enterprise-id <value>", "enterprise_id")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.enterpriseId !== undefined) args["enterprise_id"] = opts.enterpriseId;
				const result = await client.apiCall("admin.apps.approved.list", args);
				output(result);
			}),
		);

	group
		.command("apps-requests-list")
		.description("List app requests for a team/workspace.")
		.option("--limit <value>", "The maximum number of items to return. Must be between 1 - 1000 both inclusive.")
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page",
		)
		.option("--team-id <value>", "team_id")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				const result = await client.apiCall("admin.apps.requests.list", args);
				output(result);
			}),
		);

	group
		.command("apps-restrict")
		.description("Restrict an app for installation on a workspace.")
		.option("--app-id <value>", "The id of the app to restrict.")
		.option("--request-id <value>", "The id of the request to restrict.")
		.option("--team-id <value>", "team_id")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.appId !== undefined) args["app_id"] = opts.appId;
				if (opts.requestId !== undefined) args["request_id"] = opts.requestId;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				const result = await client.apiCall("admin.apps.restrict", args);
				output(result);
			}),
		);

	group
		.command("apps-restricted-list")
		.description("List restricted apps for an org or workspace.")
		.option("--limit <value>", "The maximum number of items to return. Must be between 1 - 1000 both inclusive.")
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page",
		)
		.option("--team-id <value>", "team_id")
		.option("--enterprise-id <value>", "enterprise_id")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.enterpriseId !== undefined) args["enterprise_id"] = opts.enterpriseId;
				const result = await client.apiCall("admin.apps.restricted.list", args);
				output(result);
			}),
		);

	group
		.command("conversations-archive")
		.description("Archive a public or private channel.")
		.requiredOption("--channel-id <value>", "The channel to archive.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				const result = await client.apiCall("admin.conversations.archive", args);
				output(result);
			}),
		);

	group
		.command("conversations-convertToPrivate")
		.description("Convert a public channel to a private channel.")
		.requiredOption("--channel-id <value>", "The channel to convert to private.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				const result = await client.apiCall("admin.conversations.convertToPrivate", args);
				output(result);
			}),
		);

	group
		.command("conversations-create")
		.description("Create a public or private channel-based conversation.")
		.requiredOption("--name <value>", "Name of the public or private channel to create.")
		.option("--description <value>", "Description of the public or private channel to create.")
		.requiredOption("--is-private", "When `true`, creates a private channel instead of a public channel")
		.option(
			"--org-wide",
			"When `true`, the channel will be available org-wide. Note: if the channel is not `org_wide=true`, you must specify a `team_id` for this channel",
		)
		.option(
			"--team-id <value>",
			"The workspace to create the channel in. Note: this argument is required unless you set `org_wide=true`.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.name !== undefined) args["name"] = opts.name;
				if (opts.description !== undefined) args["description"] = opts.description;
				if (opts.isPrivate !== undefined) args["is_private"] = opts.isPrivate;
				if (opts.orgWide !== undefined) args["org_wide"] = opts.orgWide;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				const result = await client.apiCall("admin.conversations.create", args);
				output(result);
			}),
		);

	group
		.command("conversations-delete")
		.description("Delete a public or private channel.")
		.requiredOption("--channel-id <value>", "The channel to delete.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				const result = await client.apiCall("admin.conversations.delete", args);
				output(result);
			}),
		);

	group
		.command("conversations-disconnectShared")
		.description("Disconnect a connected channel from one or more workspaces.")
		.requiredOption("--channel-id <value>", "The channel to be disconnected from some workspaces.")
		.option(
			"--leaving-team-ids <value>",
			"The team to be removed from the channel. Currently only a single team id can be specified.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				if (opts.leavingTeamIds !== undefined) args["leaving_team_ids"] = opts.leavingTeamIds;
				const result = await client.apiCall("admin.conversations.disconnectShared", args);
				output(result);
			}),
		);

	group
		.command("conversations-ekm-listOriginalConnectedChannelInfo")
		.description(
			"List all disconnected channels—i.e., channels that were once connected to other workspaces and then disconnected—and the corresponding original channel IDs for key revocation with EKM.",
		)
		.option("--channel-ids <value>", "A comma-separated list of channels to filter to.")
		.option(
			"--team-ids <value>",
			"A comma-separated list of the workspaces to which the channels you would like returned belong.",
		)
		.option("--limit <value>", "The maximum number of items to return. Must be between 1 - 1000 both inclusive.")
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelIds !== undefined) args["channel_ids"] = opts.channelIds;
				if (opts.teamIds !== undefined) args["team_ids"] = opts.teamIds;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("admin.conversations.ekm.listOriginalConnectedChannelInfo", args);
				output(result);
			}),
		);

	group
		.command("conversations-getConversationPrefs")
		.description("Get conversation preferences for a public or private channel.")
		.requiredOption("--channel-id <value>", "The channel to get preferences for.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				const result = await client.apiCall("admin.conversations.getConversationPrefs", args);
				output(result);
			}),
		);

	group
		.command("conversations-getTeams")
		.description("Get all the workspaces a given public or private channel is connected to within this Enterprise org.")
		.requiredOption(
			"--channel-id <value>",
			"The channel to determine connected workspaces within the organization for.",
		)
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page",
		)
		.option("--limit <value>", "The maximum number of items to return. Must be between 1 - 1000 both inclusive.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("admin.conversations.getTeams", args);
				output(result);
			}),
		);

	group
		.command("conversations-invite")
		.description("Invite a user to a public or private channel.")
		.requiredOption("--user-ids <value>", "The users to invite.")
		.requiredOption("--channel-id <value>", "The channel that the users will be invited to.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.userIds !== undefined) args["user_ids"] = opts.userIds;
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				const result = await client.apiCall("admin.conversations.invite", args);
				output(result);
			}),
		);

	group
		.command("conversations-rename")
		.description("Rename a public or private channel.")
		.requiredOption("--channel-id <value>", "The channel to rename.")
		.requiredOption("--name <value>", "name")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				if (opts.name !== undefined) args["name"] = opts.name;
				const result = await client.apiCall("admin.conversations.rename", args);
				output(result);
			}),
		);

	group
		.command("conversations-restrictAccess-addGroup")
		.description("Add an allowlist of IDP groups for accessing a channel")
		.option(
			"--team-id <value>",
			"The workspace where the channel exists. This argument is required for channels only tied to one workspace, and optional for channels that are shared across an organization.",
		)
		.requiredOption(
			"--group-id <value>",
			"The [IDP Group](https://slack.com/help/articles/115001435788-Connect-identity-provider-groups-to-your-Enterprise-Grid-org) ID to be an allowlist for the private channel.",
		)
		.requiredOption("--channel-id <value>", "The channel to link this group to.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.groupId !== undefined) args["group_id"] = opts.groupId;
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				const result = await client.apiCall("admin.conversations.restrictAccess.addGroup", args);
				output(result);
			}),
		);

	group
		.command("conversations-restrictAccess-listGroups")
		.description("List all IDP Groups linked to a channel")
		.requiredOption("--channel-id <value>", "channel_id")
		.option(
			"--team-id <value>",
			"The workspace where the channel exists. This argument is required for channels only tied to one workspace, and optional for channels that are shared across an organization.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				const result = await client.apiCall("admin.conversations.restrictAccess.listGroups", args);
				output(result);
			}),
		);

	group
		.command("conversations-restrictAccess-removeGroup")
		.description("Remove a linked IDP group linked from a private channel")
		.requiredOption(
			"--team-id <value>",
			"The workspace where the channel exists. This argument is required for channels only tied to one workspace, and optional for channels that are shared across an organization.",
		)
		.requiredOption(
			"--group-id <value>",
			"The [IDP Group](https://slack.com/help/articles/115001435788-Connect-identity-provider-groups-to-your-Enterprise-Grid-org) ID to remove from the private channel.",
		)
		.requiredOption("--channel-id <value>", "The channel to remove the linked group from.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.groupId !== undefined) args["group_id"] = opts.groupId;
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				const result = await client.apiCall("admin.conversations.restrictAccess.removeGroup", args);
				output(result);
			}),
		);

	group
		.command("conversations-search")
		.description("Search for public or private channels in an Enterprise organization.")
		.option("--team-ids <value>", "Comma separated string of team IDs, signifying the workspaces to search through.")
		.option("--query <value>", "Name of the the channel to query by.")
		.option(
			"--limit <value>",
			"Maximum number of items to be returned. Must be between 1 - 20 both inclusive. Default is 10.",
		)
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page.",
		)
		.option(
			"--search-channel-types <value>",
			"The type of channel to include or exclude in the search. For example `private` will search private channels, while `private_exclude` will exclude them. For a full list of types, check the [Types section](#types).",
		)
		.option(
			"--sort <value>",
			"Possible values are `relevant` (search ranking based on what we think is closest), `name` (alphabetical), `member_count` (number of users in the channel), and `created` (date channel was created). You can optionally pair this with the `sort_dir` arg to change how it is sorted",
		)
		.option(
			"--sort-dir <value>",
			"Sort direction. Possible values are `asc` for ascending order like (1, 2, 3) or (a, b, c), and `desc` for descending order like (3, 2, 1) or (c, b, a)",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamIds !== undefined) args["team_ids"] = opts.teamIds;
				if (opts.query !== undefined) args["query"] = opts.query;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.searchChannelTypes !== undefined) args["search_channel_types"] = opts.searchChannelTypes;
				if (opts.sort !== undefined) args["sort"] = opts.sort;
				if (opts.sortDir !== undefined) args["sort_dir"] = opts.sortDir;
				const result = await client.apiCall("admin.conversations.search", args);
				output(result);
			}),
		);

	group
		.command("conversations-setConversationPrefs")
		.description("Set the posting permissions for a public or private channel.")
		.requiredOption("--channel-id <value>", "The channel to set the prefs for")
		.requiredOption("--prefs <value>", "The prefs for this channel in a stringified JSON format.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				if (opts.prefs !== undefined) args["prefs"] = opts.prefs;
				const result = await client.apiCall("admin.conversations.setConversationPrefs", args);
				output(result);
			}),
		);

	group
		.command("conversations-setTeams")
		.description("Set the workspaces in an Enterprise grid org that connect to a public or private channel.")
		.requiredOption("--channel-id <value>", "The encoded `channel_id` to add or remove to workspaces.")
		.option(
			"--team-id <value>",
			"The workspace to which the channel belongs. Omit this argument if the channel is a cross-workspace shared channel.",
		)
		.option(
			"--target-team-ids <value>",
			"A comma-separated list of workspaces to which the channel should be shared. Not required if the channel is being shared org-wide.",
		)
		.option("--org-channel", "True if channel has to be converted to an org channel")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.targetTeamIds !== undefined) args["target_team_ids"] = opts.targetTeamIds;
				if (opts.orgChannel !== undefined) args["org_channel"] = opts.orgChannel;
				const result = await client.apiCall("admin.conversations.setTeams", args);
				output(result);
			}),
		);

	group
		.command("conversations-unarchive")
		.description("Unarchive a public or private channel.")
		.requiredOption("--channel-id <value>", "The channel to unarchive.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.channelId !== undefined) args["channel_id"] = opts.channelId;
				const result = await client.apiCall("admin.conversations.unarchive", args);
				output(result);
			}),
		);

	group
		.command("emoji-add")
		.description("Add an emoji.")
		.requiredOption(
			"--name <value>",
			"The name of the emoji to be removed. Colons (`:myemoji:`) around the value are not required, although they may be included.",
		)
		.requiredOption(
			"--url <value>",
			"The URL of a file to use as an image for the emoji. Square images under 128KB and with transparent backgrounds work best.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.name !== undefined) args["name"] = opts.name;
				if (opts.url !== undefined) args["url"] = opts.url;
				const result = await client.apiCall("admin.emoji.add", args);
				output(result);
			}),
		);

	group
		.command("emoji-addAlias")
		.description("Add an emoji alias.")
		.requiredOption(
			"--name <value>",
			"The name of the emoji to be aliased. Colons (`:myemoji:`) around the value are not required, although they may be included.",
		)
		.requiredOption("--alias-for <value>", "The alias of the emoji.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.name !== undefined) args["name"] = opts.name;
				if (opts.aliasFor !== undefined) args["alias_for"] = opts.aliasFor;
				const result = await client.apiCall("admin.emoji.addAlias", args);
				output(result);
			}),
		);

	group
		.command("emoji-list")
		.description("List emoji for an Enterprise Grid organization.")
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page",
		)
		.option("--limit <value>", "The maximum number of items to return. Must be between 1 - 1000 both inclusive.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("admin.emoji.list", args);
				output(result);
			}),
		);

	group
		.command("emoji-remove")
		.description("Remove an emoji across an Enterprise Grid organization")
		.requiredOption(
			"--name <value>",
			"The name of the emoji to be removed. Colons (`:myemoji:`) around the value are not required, although they may be included.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.name !== undefined) args["name"] = opts.name;
				const result = await client.apiCall("admin.emoji.remove", args);
				output(result);
			}),
		);

	group
		.command("emoji-rename")
		.description("Rename an emoji.")
		.requiredOption(
			"--name <value>",
			"The name of the emoji to be renamed. Colons (`:myemoji:`) around the value are not required, although they may be included.",
		)
		.requiredOption("--new-name <value>", "The new name of the emoji.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.name !== undefined) args["name"] = opts.name;
				if (opts.newName !== undefined) args["new_name"] = opts.newName;
				const result = await client.apiCall("admin.emoji.rename", args);
				output(result);
			}),
		);

	group
		.command("inviteRequests-approve")
		.description("Approve a workspace invite request.")
		.option("--team-id <value>", "ID for the workspace where the invite request was made.")
		.requiredOption("--invite-request-id <value>", "ID of the request to invite.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.inviteRequestId !== undefined) args["invite_request_id"] = opts.inviteRequestId;
				const result = await client.apiCall("admin.inviteRequests.approve", args);
				output(result);
			}),
		);

	group
		.command("inviteRequests-approved-list")
		.description("List all approved workspace invite requests.")
		.option("--team-id <value>", "ID for the workspace where the invite requests were made.")
		.option("--cursor <value>", "Value of the `next_cursor` field sent as part of the previous API response")
		.option(
			"--limit <value>",
			"The number of results that will be returned by the API on each invocation. Must be between 1 - 1000, both inclusive",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("admin.inviteRequests.approved.list", args);
				output(result);
			}),
		);

	group
		.command("inviteRequests-denied-list")
		.description("List all denied workspace invite requests.")
		.option("--team-id <value>", "ID for the workspace where the invite requests were made.")
		.option("--cursor <value>", "Value of the `next_cursor` field sent as part of the previous api response")
		.option(
			"--limit <value>",
			"The number of results that will be returned by the API on each invocation. Must be between 1 - 1000 both inclusive",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("admin.inviteRequests.denied.list", args);
				output(result);
			}),
		);

	group
		.command("inviteRequests-deny")
		.description("Deny a workspace invite request.")
		.option("--team-id <value>", "ID for the workspace where the invite request was made.")
		.requiredOption("--invite-request-id <value>", "ID of the request to invite.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.inviteRequestId !== undefined) args["invite_request_id"] = opts.inviteRequestId;
				const result = await client.apiCall("admin.inviteRequests.deny", args);
				output(result);
			}),
		);

	group
		.command("inviteRequests-list")
		.description("List all pending workspace invite requests.")
		.option("--team-id <value>", "ID for the workspace where the invite requests were made.")
		.option("--cursor <value>", "Value of the `next_cursor` field sent as part of the previous API response")
		.option(
			"--limit <value>",
			"The number of results that will be returned by the API on each invocation. Must be between 1 - 1000, both inclusive",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("admin.inviteRequests.list", args);
				output(result);
			}),
		);

	group
		.command("teams-admins-list")
		.description("List all of the admins on a given workspace.")
		.option("--limit <value>", "The maximum number of items to return.")
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page.",
		)
		.requiredOption("--team-id <value>", "team_id")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				const result = await client.apiCall("admin.teams.admins.list", args);
				output(result);
			}),
		);

	group
		.command("teams-create")
		.description("Create an Enterprise team.")
		.requiredOption("--team-domain <value>", "Team domain (for example, slacksoftballteam).")
		.requiredOption("--team-name <value>", "Team name (for example, Slack Softball Team).")
		.option("--team-description <value>", "Description for the team.")
		.option(
			"--team-discoverability <value>",
			"Who can join the team. A team's discoverability can be `open`, `closed`, `invite_only`, or `unlisted`.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamDomain !== undefined) args["team_domain"] = opts.teamDomain;
				if (opts.teamName !== undefined) args["team_name"] = opts.teamName;
				if (opts.teamDescription !== undefined) args["team_description"] = opts.teamDescription;
				if (opts.teamDiscoverability !== undefined) args["team_discoverability"] = opts.teamDiscoverability;
				const result = await client.apiCall("admin.teams.create", args);
				output(result);
			}),
		);

	group
		.command("teams-list")
		.description("List all teams on an Enterprise organization")
		.option("--limit <value>", "The maximum number of items to return. Must be between 1 - 100 both inclusive.")
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("admin.teams.list", args);
				output(result);
			}),
		);

	group
		.command("teams-owners-list")
		.description("List all of the owners on a given workspace.")
		.requiredOption("--team-id <value>", "team_id")
		.option("--limit <value>", "The maximum number of items to return. Must be between 1 - 1000 both inclusive.")
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				const result = await client.apiCall("admin.teams.owners.list", args);
				output(result);
			}),
		);

	group
		.command("teams-settings-info")
		.description("Fetch information about settings in a workspace")
		.requiredOption("--team-id <value>", "team_id")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				const result = await client.apiCall("admin.teams.settings.info", args);
				output(result);
			}),
		);

	group
		.command("teams-settings-setDefaultChannels")
		.description("Set the default channels of a workspace.")
		.requiredOption("--team-id <value>", "ID for the workspace to set the default channel for.")
		.requiredOption("--channel-ids <value>", "An array of channel IDs.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.channelIds !== undefined) args["channel_ids"] = opts.channelIds;
				const result = await client.apiCall("admin.teams.settings.setDefaultChannels", args);
				output(result);
			}),
		);

	group
		.command("teams-settings-setDescription")
		.description("Set the description of a given workspace.")
		.requiredOption("--team-id <value>", "ID for the workspace to set the description for.")
		.requiredOption("--description <value>", "The new description for the workspace.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.description !== undefined) args["description"] = opts.description;
				const result = await client.apiCall("admin.teams.settings.setDescription", args);
				output(result);
			}),
		);

	group
		.command("teams-settings-setDiscoverability")
		.description("An API method that allows admins to set the discoverability of a given workspace")
		.requiredOption("--team-id <value>", "The ID of the workspace to set discoverability on.")
		.requiredOption(
			"--discoverability <value>",
			"This workspace's discovery setting. It must be set to one of `open`, `invite_only`, `closed`, or `unlisted`.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.discoverability !== undefined) args["discoverability"] = opts.discoverability;
				const result = await client.apiCall("admin.teams.settings.setDiscoverability", args);
				output(result);
			}),
		);

	group
		.command("teams-settings-setIcon")
		.description("Sets the icon of a workspace.")
		.requiredOption("--image-url <value>", "Image URL for the icon")
		.requiredOption("--team-id <value>", "ID for the workspace to set the icon for.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.imageUrl !== undefined) args["image_url"] = opts.imageUrl;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				const result = await client.apiCall("admin.teams.settings.setIcon", args);
				output(result);
			}),
		);

	group
		.command("teams-settings-setName")
		.description("Set the name of a given workspace.")
		.requiredOption("--team-id <value>", "ID for the workspace to set the name for.")
		.requiredOption("--name <value>", "The new name of the workspace.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.name !== undefined) args["name"] = opts.name;
				const result = await client.apiCall("admin.teams.settings.setName", args);
				output(result);
			}),
		);

	group
		.command("usergroups-addChannels")
		.description("Add one or more default channels to an IDP group.")
		.requiredOption("--usergroup-id <value>", "ID of the IDP group to add default channels for.")
		.option("--team-id <value>", "The workspace to add default channels in.")
		.requiredOption("--channel-ids <value>", "Comma separated string of channel IDs.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.usergroupId !== undefined) args["usergroup_id"] = opts.usergroupId;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.channelIds !== undefined) args["channel_ids"] = opts.channelIds;
				const result = await client.apiCall("admin.usergroups.addChannels", args);
				output(result);
			}),
		);

	group
		.command("usergroups-addTeams")
		.description("Associate one or more default workspaces with an organization-wide IDP group.")
		.requiredOption("--usergroup-id <value>", "An encoded usergroup (IDP Group) ID.")
		.requiredOption(
			"--team-ids <value>",
			"A comma separated list of encoded team (workspace) IDs. Each workspace *MUST* belong to the organization associated with the token.",
		)
		.option(
			"--auto-provision",
			"When `true`, this method automatically creates new workspace accounts for the IDP group members.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.usergroupId !== undefined) args["usergroup_id"] = opts.usergroupId;
				if (opts.teamIds !== undefined) args["team_ids"] = opts.teamIds;
				if (opts.autoProvision !== undefined) args["auto_provision"] = opts.autoProvision;
				const result = await client.apiCall("admin.usergroups.addTeams", args);
				output(result);
			}),
		);

	group
		.command("usergroups-listChannels")
		.description("List the channels linked to an org-level IDP group (user group).")
		.requiredOption("--usergroup-id <value>", "ID of the IDP group to list default channels for.")
		.option("--team-id <value>", "ID of the the workspace.")
		.option("--include-num-members", "Flag to include or exclude the count of members per channel.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.usergroupId !== undefined) args["usergroup_id"] = opts.usergroupId;
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.includeNumMembers !== undefined) args["include_num_members"] = opts.includeNumMembers;
				const result = await client.apiCall("admin.usergroups.listChannels", args);
				output(result);
			}),
		);

	group
		.command("usergroups-removeChannels")
		.description("Remove one or more default channels from an org-level IDP group (user group).")
		.requiredOption("--usergroup-id <value>", "ID of the IDP Group")
		.requiredOption("--channel-ids <value>", "Comma-separated string of channel IDs")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.usergroupId !== undefined) args["usergroup_id"] = opts.usergroupId;
				if (opts.channelIds !== undefined) args["channel_ids"] = opts.channelIds;
				const result = await client.apiCall("admin.usergroups.removeChannels", args);
				output(result);
			}),
		);

	group
		.command("users-assign")
		.description("Add an Enterprise user to a workspace.")
		.requiredOption("--team-id <value>", "The ID (`T1234`) of the workspace.")
		.requiredOption("--user-id <value>", "The ID of the user to add to the workspace.")
		.option("--is-restricted", "True if user should be added to the workspace as a guest.")
		.option("--is-ultra-restricted", "True if user should be added to the workspace as a single-channel guest.")
		.option("--channel-ids <value>", "Comma separated values of channel IDs to add user in the new workspace.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.userId !== undefined) args["user_id"] = opts.userId;
				if (opts.isRestricted !== undefined) args["is_restricted"] = opts.isRestricted;
				if (opts.isUltraRestricted !== undefined) args["is_ultra_restricted"] = opts.isUltraRestricted;
				if (opts.channelIds !== undefined) args["channel_ids"] = opts.channelIds;
				const result = await client.apiCall("admin.users.assign", args);
				output(result);
			}),
		);

	group
		.command("users-invite")
		.description("Invite a user to a workspace.")
		.requiredOption("--team-id <value>", "The ID (`T1234`) of the workspace.")
		.requiredOption("--email <value>", "The email address of the person to invite.")
		.requiredOption(
			"--channel-ids <value>",
			"A comma-separated list of `channel_id`s for this user to join. At least one channel is required.",
		)
		.option("--custom-message <value>", "An optional message to send to the user in the invite email.")
		.option("--real-name <value>", "Full name of the user.")
		.option(
			"--resend",
			"Allow this invite to be resent in the future if a user has not signed up yet. (default: false)",
		)
		.option("--is-restricted", "Is this user a multi-channel guest user? (default: false)")
		.option("--is-ultra-restricted", "Is this user a single channel guest user? (default: false)")
		.option(
			"--guest-expiration-ts <value>",
			"Timestamp when guest account should be disabled. Only include this timestamp if you are inviting a guest user and you want their account to expire on a certain date.",
		)
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.email !== undefined) args["email"] = opts.email;
				if (opts.channelIds !== undefined) args["channel_ids"] = opts.channelIds;
				if (opts.customMessage !== undefined) args["custom_message"] = opts.customMessage;
				if (opts.realName !== undefined) args["real_name"] = opts.realName;
				if (opts.resend !== undefined) args["resend"] = opts.resend;
				if (opts.isRestricted !== undefined) args["is_restricted"] = opts.isRestricted;
				if (opts.isUltraRestricted !== undefined) args["is_ultra_restricted"] = opts.isUltraRestricted;
				if (opts.guestExpirationTs !== undefined) args["guest_expiration_ts"] = opts.guestExpirationTs;
				const result = await client.apiCall("admin.users.invite", args);
				output(result);
			}),
		);

	group
		.command("users-list")
		.description("List users on a workspace")
		.requiredOption("--team-id <value>", "The ID (`T1234`) of the workspace.")
		.option(
			"--cursor <value>",
			"Set `cursor` to `next_cursor` returned by the previous call to list items in the next page.",
		)
		.option("--limit <value>", "Limit for how many users to be retrieved per page")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.cursor !== undefined) args["cursor"] = opts.cursor;
				if (opts.limit !== undefined) args["limit"] = opts.limit;
				const result = await client.apiCall("admin.users.list", args);
				output(result);
			}),
		);

	group
		.command("users-remove")
		.description("Remove a user from a workspace.")
		.requiredOption("--team-id <value>", "The ID (`T1234`) of the workspace.")
		.requiredOption("--user-id <value>", "The ID of the user to remove.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.userId !== undefined) args["user_id"] = opts.userId;
				const result = await client.apiCall("admin.users.remove", args);
				output(result);
			}),
		);

	group
		.command("users-session-invalidate")
		.description("Invalidate a single session for a user by session_id")
		.requiredOption("--team-id <value>", "ID of the team that the session belongs to")
		.requiredOption("--session-id <value>", "session_id")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.sessionId !== undefined) args["session_id"] = opts.sessionId;
				const result = await client.apiCall("admin.users.session.invalidate", args);
				output(result);
			}),
		);

	group
		.command("users-session-reset")
		.description("Wipes all valid sessions on all devices for a given user")
		.requiredOption("--user-id <value>", "The ID of the user to wipe sessions for")
		.option("--mobile-only", "Only expire mobile sessions (default: false)")
		.option("--web-only", "Only expire web sessions (default: false)")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.userId !== undefined) args["user_id"] = opts.userId;
				if (opts.mobileOnly !== undefined) args["mobile_only"] = opts.mobileOnly;
				if (opts.webOnly !== undefined) args["web_only"] = opts.webOnly;
				const result = await client.apiCall("admin.users.session.reset", args);
				output(result);
			}),
		);

	group
		.command("users-setAdmin")
		.description("Set an existing guest, regular user, or owner to be an admin user.")
		.requiredOption("--team-id <value>", "The ID (`T1234`) of the workspace.")
		.requiredOption("--user-id <value>", "The ID of the user to designate as an admin.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.userId !== undefined) args["user_id"] = opts.userId;
				const result = await client.apiCall("admin.users.setAdmin", args);
				output(result);
			}),
		);

	group
		.command("users-setExpiration")
		.description("Set an expiration for a guest user")
		.requiredOption("--team-id <value>", "The ID (`T1234`) of the workspace.")
		.requiredOption("--user-id <value>", "The ID of the user to set an expiration for.")
		.requiredOption("--expiration-ts <value>", "Timestamp when guest account should be disabled.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.userId !== undefined) args["user_id"] = opts.userId;
				if (opts.expirationTs !== undefined) args["expiration_ts"] = opts.expirationTs;
				const result = await client.apiCall("admin.users.setExpiration", args);
				output(result);
			}),
		);

	group
		.command("users-setOwner")
		.description("Set an existing guest, regular user, or admin user to be a workspace owner.")
		.requiredOption("--team-id <value>", "The ID (`T1234`) of the workspace.")
		.requiredOption("--user-id <value>", "Id of the user to promote to owner.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.userId !== undefined) args["user_id"] = opts.userId;
				const result = await client.apiCall("admin.users.setOwner", args);
				output(result);
			}),
		);

	group
		.command("users-setRegular")
		.description("Set an existing guest user, admin user, or owner to be a regular user.")
		.requiredOption("--team-id <value>", "The ID (`T1234`) of the workspace.")
		.requiredOption("--user-id <value>", "The ID of the user to designate as a regular user.")
		.action(
			handleAsyncCommand(async (opts) => {
				const client = getClient();
				const args: Record<string, unknown> = {};
				if (opts.teamId !== undefined) args["team_id"] = opts.teamId;
				if (opts.userId !== undefined) args["user_id"] = opts.userId;
				const result = await client.apiCall("admin.users.setRegular", args);
				output(result);
			}),
		);
}
