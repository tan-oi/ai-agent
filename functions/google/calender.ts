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

export async function checkAvailability(
  startTime?: Date,
  endTime?: Date,
  calendarIds: string[] = ["primary"]
) {
  try {
    const calenderClient = await createCalenderClient();
    const timeMin = startTime || new Date();
    const timeMax = endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await calenderClient.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: calendarIds.map((id) => ({ id })),
        timeZone: "UTC",
      },
    });

    const calendars = result.data.calendars;

    
    const availability = Object.entries(calendars || {}).map(
      ([calendarId, data]) => ({
        calendarId,
        busy: data.busy || [],
        errors: data.errors,
        
      })
    );

    return {
      success: true,
      availability,
      timeRange: {
        start: timeMin.toISOString(),
        end: timeMax.toISOString(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to check availability",
    };
  }
}

export async function findFreeSlots(
  startTime: Date,
  endTime: Date,
  durationMinutes: number = 30,
  calendarIds: string[] = ["primary"]
) {
  try {
    const availabilityResult = await checkAvailability(
      startTime,
      endTime,
      calendarIds
    );

    if (!availabilityResult.availability) {
      return availabilityResult;
    }

    const busySlots = availabilityResult?.availability
      .flatMap((cal) => cal.busy)
      .map((slot) => ({
        start: new Date(slot.start!),
        end: new Date(slot.end!),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const freeSlots = [];
    let currentTime = new Date(startTime);

    for (const busySlot of busySlots) {
      if (currentTime < busySlot.start) {
        const gap = busySlot.start.getTime() - currentTime.getTime();
        if (gap >= durationMinutes * 60 * 1000) {
          freeSlots.push({
            start: currentTime.toISOString(),
            end: busySlot.start.toISOString(),
          });
        }
      }
      currentTime = new Date(
        Math.max(currentTime.getTime(), busySlot.end.getTime())
      );
    }

    // Check if there's free time after the last busy slot
    if (currentTime < endTime) {
      const gap = endTime.getTime() - currentTime.getTime();
      if (gap >= durationMinutes * 60 * 1000) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: endTime.toISOString(),
        });
      }
    }

    return {
      success: true,
      freeSlots,
      busySlots: busySlots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      })),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to find free slots",
    };
  }
}
