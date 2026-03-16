import { googleApiFetch } from "./google.service";

const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";
const DEFAULT_TIMEZONE = "Europe/Warsaw";

interface CalendarEventInput {
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
  location?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink: string;
  status: string;
}

interface ListEventsOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  q?: string;
}

export async function createCalendarEvent(
  userId: string,
  input: CalendarEventInput
): Promise<{ id: string; summary: string; htmlLink: string }> {
  const body = {
    summary: input.summary,
    description: input.description,
    location: input.location,
    start: {
      dateTime: input.startDateTime,
      timeZone: DEFAULT_TIMEZONE,
    },
    end: {
      dateTime: input.endDateTime,
      timeZone: DEFAULT_TIMEZONE,
    },
  };

  const response = await googleApiFetch(
    userId,
    `${CALENDAR_BASE}/calendars/primary/events`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Calendar API error: ${err}`);
  }

  const event = await response.json();
  return {
    id: event.id,
    summary: event.summary,
    htmlLink: event.htmlLink,
  };
}

export async function listCalendarEvents(
  userId: string,
  options: ListEventsOptions = {}
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeZone: DEFAULT_TIMEZONE,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(options.maxResults || 10),
  });

  if (options.timeMin) params.set("timeMin", options.timeMin);
  if (options.timeMax) params.set("timeMax", options.timeMax);
  if (options.q) params.set("q", options.q);

  const response = await googleApiFetch(
    userId,
    `${CALENDAR_BASE}/calendars/primary/events?${params}`
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Calendar API error: ${err}`);
  }

  const data = await response.json();
  return (data.items || []) as CalendarEvent[];
}
