import { tool } from "ai";
import { z } from "zod";
import { getCalendarClient } from "@/lib/google-auth";

export const calendarListEvents = tool({
	description: "List upcoming calendar events. Defaults to today. Use when asked about meetings or schedule.",
	inputSchema: z.object({
		daysAhead: z
			.number()
			.optional()
			.default(1)
			.pipe(z.number().max(30))
			.describe("Number of days to look ahead (default 1 = today only)"),
		limit: z.number().optional().default(15).pipe(z.number().max(50)),
	}),
	execute: async ({ daysAhead, limit }) => {
		const calendar = getCalendarClient();

		const now = new Date();
		const end = new Date(now);
		end.setDate(end.getDate() + daysAhead);

		const res = await calendar.events.list({
			calendarId: "primary",
			timeMin: now.toISOString(),
			timeMax: end.toISOString(),
			maxResults: limit,
			singleEvents: true,
			orderBy: "startTime",
		});

		return (res.data.items ?? []).map((event) => ({
			title: event.summary,
			start: event.start?.dateTime || event.start?.date,
			end: event.end?.dateTime || event.end?.date,
			location: event.location,
			attendees: event.attendees?.map((a) => a.email).slice(0, 10),
			meetLink: event.hangoutLink,
			status: event.status,
		}));
	},
});

export const calendarCreateEvent = tool({
	description: "Create a calendar event. Returns the event link. Use when asked to schedule something.",
	needsApproval: async ({ attendees }) => (attendees?.length ?? 0) > 0,
	inputSchema: z.object({
		title: z.string().max(500).describe("Event title"),
		startTime: z.string().max(50).describe("Start time in ISO 8601 (e.g. 2026-03-19T10:00:00-06:00)"),
		endTime: z.string().max(50).describe("End time in ISO 8601"),
		description: z.string().max(2000).optional(),
		attendees: z.array(z.string().max(200)).optional().describe("Email addresses of attendees"),
		location: z.string().max(500).optional(),
	}),
	execute: async ({ title, startTime, endTime, description, attendees, location }) => {
		const calendar = getCalendarClient();

		const res = await calendar.events.insert({
			calendarId: "primary",
			requestBody: {
				summary: title,
				description,
				location,
				start: { dateTime: startTime },
				end: { dateTime: endTime },
				attendees: attendees?.map((email) => ({ email })),
			},
		});

		return {
			id: res.data.id,
			title: res.data.summary,
			start: res.data.start?.dateTime,
			end: res.data.end?.dateTime,
			link: res.data.htmlLink,
			status: "Created",
		};
	},
});
