import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events, users, families } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { endOfMonth } from "date-fns";
import CalendarClient from "./calendar-client";
import { getHolidaysForYear } from "@/lib/holidays";

export const dynamic = "force-dynamic";

interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  notes?: string;
  recurrence?: "none" | "daily" | "weekly" | "biweekly" | "triweekly" | "quadweekly" | "monthly" | "yearly";
  excludedDates?: string[];
  isHoliday?: boolean;
}

export default async function CalendarPage() {
  const { userId } = await auth();
  
  // Note: userId is guaranteed by proxy.ts (clerkMiddleware)
  // but we'll keep the check as a safety fallback if proxy.ts is ever modified.
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user and family data server-side
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { familyId: true },
  });

  // If no family, redirect to onboarding
  if (!user?.familyId) {
    redirect("/onboarding");
  }

  // Fetch family's country
  const family = await db.query.families.findFirst({
    where: eq(families.id, user.familyId),
    columns: { country: true },
  });

  // Fetch events for current month server-side
  const today = new Date();
  const currentYear = today.getFullYear();
  const monthEnd = endOfMonth(today);

  const eventsList = await db.query.events.findMany({
    where: and(
      eq(events.familyId, user.familyId),
      lte(events.startDate, monthEnd)
    ),
    orderBy: (events, { asc }) => [asc(events.startDate)],
  });

  // Parse dates for serialization
  const parsedEvents: Event[] = eventsList.map(event => ({
    id: event.id,
    title: event.title,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : undefined,
    allDay: event.allDay ?? true,
    startTime: event.startTime ?? undefined,
    endTime: event.endTime ?? undefined,
    notes: event.notes ?? undefined,
    recurrence: event.recurrence,
    excludedDates: event.excludedDates ?? undefined,
    recurrenceEndDate: event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : undefined,
  }));

  // Fetch holidays for current year - add as events for display
  if (family?.country) {
    const holidays = await getHolidaysForYear(family.country, currentYear);
    holidays.forEach(h => {
      // Only add if not already in events (avoid duplicates)
      const holidayDate = h.date;
      const exists = parsedEvents.some(e => {
        const eDate = e.startDate.toISOString().split('T')[0];
        return eDate === holidayDate && e.title === h.name;
      });
      if (!exists) {
        parsedEvents.push({
          id: `holiday-${holidayDate}`,
          title: h.name,
          startDate: new Date(holidayDate),
          allDay: true,
          isHoliday: true,
        });
      }
    });
  }

  return <CalendarClient initialEvents={parsedEvents} hasFamily={true} />;
}
