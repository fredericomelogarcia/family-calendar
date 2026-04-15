import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { startOfDay, endOfDay, addDays } from "date-fns";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  notes?: string;
  recurrence?: string;
  startTime?: string;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const userFirstName = clerkUser?.firstName || "there";

  // Fetch user and family data server-side
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { familyId: true },
  });

  // If no family, return early with empty state
  if (!user?.familyId) {
    return (
      <DashboardClient 
        initialEvents={[]}
        hasFamily={false}
        userFirstName={userFirstName}
      />
    );
  }

  // Fetch events server-side with date range
  const today = new Date();
  const startDate = addDays(startOfDay(today), -7);
  const endDate = addDays(endOfDay(today), 30);

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
    notes: event.notes ?? undefined,
    recurrence: event.recurrence,
  }));

  return (
    <DashboardClient
      initialEvents={parsedEvents}
      hasFamily={true}
      userFirstName={userFirstName}
    />
  );
}
