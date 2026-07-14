/**
 * Google OAuth2 clients for the optional Google-backed tools.
 *
 *   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — OAuth app credentials
 *   GOOGLE_REFRESH_TOKEN — Gmail, Calendar (and Drive fallback)
 *   GOOGLE_DRIVE_REFRESH_TOKEN — knowledge base / Drive, if it uses a
 *     different grant (falls back to GOOGLE_REFRESH_TOKEN)
 */

import { google } from "googleapis";

function createOAuth2Client(refreshToken: string) {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

	if (!clientId || !clientSecret || !refreshToken) {
		throw new Error("Server configuration error: missing Google credentials");
	}

	const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
	oauth2.setCredentials({ refresh_token: refreshToken });
	return oauth2;
}

let _gmailAuth: ReturnType<typeof createOAuth2Client> | null = null;
let _driveAuth: ReturnType<typeof createOAuth2Client> | null = null;

function getGmailAuth() {
	if (!_gmailAuth) {
		const token = process.env.GOOGLE_REFRESH_TOKEN;
		if (!token) throw new Error("Missing Gmail credentials");
		_gmailAuth = createOAuth2Client(token);
	}
	return _gmailAuth;
}

function getDriveAuth() {
	if (!_driveAuth) {
		const token = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
		if (!token) throw new Error("Missing Drive credentials");
		_driveAuth = createOAuth2Client(token);
	}
	return _driveAuth;
}

export function getGmailClient() {
	return google.gmail({ version: "v1", auth: getGmailAuth() });
}

export function getDriveClient() {
	return google.drive({ version: "v3", auth: getDriveAuth() });
}

export function getCalendarClient() {
	return google.calendar({ version: "v3", auth: getGmailAuth() });
}
