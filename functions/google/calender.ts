import { createCalenderClient } from "@/lib/google-client";

export async function ListEvents() {
  try {
    const calenderClient = createCalenderClient();

    const result = (await calenderClient).events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (await result).data.items;

    return {
      success: true,
      calender: {
        events: events,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to list events",
    };
  }
}
