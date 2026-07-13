/**
 * Auto-generated command registry — registers all API groups.
 * Run: npm run generate
 */

import type { Command } from "commander";

import { setupAdminCommand } from "./admin.js";
import { setupApiCommand } from "./api.js";
import { setupAppsCommand } from "./apps.js";
import { setupAuthCommand } from "./auth.js";
import { setupBookmarksCommand } from "./bookmarks.js";
import { setupBotsCommand } from "./bots.js";
import { setupCallsCommand } from "./calls.js";
import { setupCanvasesCommand } from "./canvases.js";
import { setupChatCommand } from "./chat.js";
import { setupCompletionCommand } from "./completion.js";
import { setupConversationsCommand } from "./conversations.js";
import { setupDialogCommand } from "./dialog.js";
import { setupDndCommand } from "./dnd.js";
import { setupEmojiCommand } from "./emoji.js";
import { setupFilesCommand } from "./files.js";
import { setupFunctionsCommand } from "./functions.js";
import { setupMigrationCommand } from "./migration.js";
import { setupOauthCommand } from "./oauth.js";
import { setupPinsCommand } from "./pins.js";
import { setupReactionsCommand } from "./reactions.js";
import { setupRemindersCommand } from "./reminders.js";
import { setupRtmCommand } from "./rtm.js";
import { setupSearchCommand } from "./search.js";
import { setupSlackListsCommand } from "./slackLists.js";
import { setupStarsCommand } from "./stars.js";
import { setupTeamCommand } from "./team.js";
import { setupUsergroupsCommand } from "./usergroups.js";
import { setupUsersCommand } from "./users.js";
import { setupViewsCommand } from "./views.js";
import { setupWorkflowsCommand } from "./workflows.js";

export function registerAllCommands(program: Command): void {
	setupAdminCommand(program);
	setupApiCommand(program);
	setupAppsCommand(program);
	setupAuthCommand(program);
	setupBookmarksCommand(program);
	setupBotsCommand(program);
	setupCallsCommand(program);
	setupCanvasesCommand(program);
	setupChatCommand(program);
	setupCompletionCommand(program);
	setupConversationsCommand(program);
	setupDialogCommand(program);
	setupDndCommand(program);
	setupEmojiCommand(program);
	setupFilesCommand(program);
	setupFunctionsCommand(program);
	setupMigrationCommand(program);
	setupOauthCommand(program);
	setupPinsCommand(program);
	setupReactionsCommand(program);
	setupRemindersCommand(program);
	setupRtmCommand(program);
	setupSearchCommand(program);
	setupSlackListsCommand(program);
	setupStarsCommand(program);
	setupTeamCommand(program);
	setupUsergroupsCommand(program);
	setupUsersCommand(program);
	setupViewsCommand(program);
	setupWorkflowsCommand(program);
}
