import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, lte, gte } from "drizzle-orm";
import { startOfDay, endOfDay, parseISO } from "date-fns";

// GET /api/events
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const event = await db.query.events.findFirst({
        where: eq(events.id, id),
      });
      return NextResponse.json({ event });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.familyId) {
      return NextResponse.json({ events: [] });
    }

    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const conditions = [eq(events.familyId, user.familyId)];

    if (start && end) {
      conditions.push(lte(events.startDate, endOfDay(parseISO(end))));
    } else if (start) {
      conditions.push(gte(events.startDate, startOfDay(parseISO(start))));
    }

    const eventsList = await db.query.events.findMany({
      where: and(...conditions),
      orderBy: (events, { asc }) => [asc(events.startDate)],
    });

    return NextResponse.json({ events: eventsList });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/events - Create event
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const body = await request.json();
    const { title, startDate, endDate, allDay, color, notes } = body;

    if (!title || title.length < 2) {
      return NextResponse.json({ error: "Title must be at least 2 characters" }, { status: 400 });
    }

    const now = new Date();
    const eventId = crypto.randomUUID();

    await db.insert(events).values({
      id: eventId,
      familyId: user.familyId,
      title,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      allDay: allDay ?? true,
      color: color || "#7C9A7E",
      notes: notes || null,
      recurrence: body.recurrence || "none",
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const createdEvent = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    return NextResponse.json({ event: createdEvent }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// PATCH /api/events - Update event
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, startDate, endDate, allDay, color, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, id),
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updates: Partial<typeof events.$inferInsert> = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = title;
    if (startDate !== undefined) updates.startDate = new Date(startDate);
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (allDay !== undefined) updates.allDay = allDay;
    if (color !== undefined) updates.color = color;
    if (notes !== undefined) updates.notes = notes || null;
    if (body.recurrence !== undefined) updates.recurrence = body.recurrence;
    if (body.excludedDates !== undefined) updates.excludedDates = body.excludedDates;

    await db.update(events)
      .set(updates)
      .where(eq(events.id, id));

    const updatedEvent = await db.query.events.findFirst({
      where: eq(events.id, id),
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE /api/events - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const deleteAll = searchParams.get("deleteAll") === "true";
    const dateStr = searchParams.get("date"); // ISO date string of the specific occurrence

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Check event exists
    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, id),
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isRecurring = existingEvent.recurrence && existingEvent.recurrence !== "none";

    if (isRecurring && !deleteAll && dateStr) {
      // "Delete this event only" on a recurring event:
      // Add the date to excludedDates so this occurrence is skipped
      const excludedDates: string[] = (existingEvent.excludedDates as string[]) || [];
      if (!excludedDates.includes(dateStr)) {
        excludedDates.push(dateStr);
      }
      await db.update(events)
        .set({ excludedDates, updatedAt: new Date() } as any)
        .where(eq(events.id, id));

      return NextResponse.json({ success: true, excludedDates });
    }

    if (isRecurring && deleteAll && dateStr) {
      // "Delete this and future events" on a recurring event:
      // Instead of deleting the entire event, set the endDate to the day before
      // the clicked occurrence. This preserves all past occurrences.
      const occurrenceDate = new Date(dateStr + "T00:00:00");
      const eventStart = new Date(existingEvent.startDate);

      // Strip time from eventStart for comparison
      const eventStartDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
      const occurrenceDay = new Date(occurrenceDate.getFullYear(), occurrenceDate.getMonth(), occurrenceDate.getDate());

      // If the occurrence date is the same as or before the start date,
      // there are no past occurrences to preserve — delete the whole event.
      if (occurrenceDay <= eventStartDay) {
        await db.delete(events).where(eq(events.id, id));
        return NextResponse.json({ success: true });
      }

      // Set endDate to the day before the clicked occurrence.
      // This preserves all occurrences before the clicked date.
      const newEndDate = new Date(occurrenceDate);
      newEndDate.setDate(newEndDate.getDate() - 1);
      // Set to end of that day
      newEndDate.setHours(23, 59, 59, 999);

      // Also remove any excluded dates that fall after newEndDate (they're now redundant)
      const currentExcluded: string[] = (existingEvent.excludedDates as string[]) || [];
      const cleanedExcluded = currentExcluded.filter(d => new Date(d) <= newEndDate);

      await db.update(events)
        .set({
          endDate: newEndDate,
          excludedDates: cleanedExcluded.length > 0 ? cleanedExcluded : null,
          updatedAt: new Date(),
        } as any)
        .where(eq(events.id, id));

      return NextResponse.json({ success: true, endDate: newEndDate.toISOString() });
    }

    // Full delete (non-recurring, or recurring with no date context)
    await db.delete(events).where(eq(events.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}