import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { startOfMonth, endOfMonth } from "date-fns";
import CalendarClient from "./calendar-client";

export const dynamic = "force-dynamic";

interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  notes?: string;
  recurrence?: string;
  excludedDates?: string[];
}

export default async function CalendarPage() {
  const { userId } = await auth();
  
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

  // Fetch events for current month server-side
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const eventsList = await db.query.events.findMany({
    where: and(
      eq(events.familyId, user.familyId),
      gte(events.startDate, monthStart),
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
    notes: event.notes ?? undefined,
    recurrence: event.recurrence,
    excludedDates: event.excludedDates ?? undefined,
  }));

  return <CalendarClient initialEvents={parsedEvents} hasFamily={true} />;
}
