import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events, users, families } from "@/lib/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { startOfDay, endOfDay, addDays } from "date-fns";
import DashboardClient from "./dashboard-client";
import { getHolidaysForYear } from "@/lib/holidays";

// Force dynamic and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Dashboard | Zawly",
};

interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  notes?: string;
  recurrence?: string;
  isHoliday?: boolean;
  recurrenceEndDate?: Date;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user and family data server-side - no caching
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { familyId: true },
  });

  // If no user record exists in DB yet, create it
  if (!user) {
    // User exists in Clerk but not in our DB - create them without a family
    await db.insert(users).values({
      id: userId,
      role: "member",
    });
    redirect("/onboarding");
  }

  // If no family, redirect to onboarding
  if (!user?.familyId) {
    redirect("/onboarding");
  }

  // Fetch family's country
  const family = await db.query.families.findFirst({
    where: eq(families.id, user.familyId),
    columns: { country: true },
  });

  // Fetch events server-side with date range
  const today = new Date();
  const currentYear = today.getFullYear();
  const startDate = addDays(startOfDay(today), -730); // ~2 years back
  const endDate = addDays(endOfDay(today), 60); // ~2 months ahead

  const eventsList = await db.query.events.findMany({
    where: and(
      eq(events.familyId, user.familyId),
      gte(events.startDate, startDate),
      lte(events.startDate, endDate)
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
    recurrenceEndDate: event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : undefined,
  }));

  // Add holidays to events
  if (family?.country) {
    const holidays = await getHolidaysForYear(family.country, currentYear);
    holidays.forEach(h => {
      const holidayDate = new Date(h.date);
      // Only add if within our date range
      if (holidayDate >= startDate && holidayDate <= endDate) {
        parsedEvents.push({
          id: `holiday-${h.date}`,
          title: h.name,
          startDate: holidayDate,
          allDay: true,
          isHoliday: true,
        });
      }
    });
  }

  // Sort events by date
  parsedEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return (
    <DashboardClient
      initialEvents={parsedEvents}
      hasFamily={true}
    />
  );
}
