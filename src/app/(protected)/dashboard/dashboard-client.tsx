"use client";

import { useState, useEffect, useCallback, useMemo, memo, Suspense, lazy } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { format, isSameDay, startOfDay, endOfDay, addDays } from "date-fns";
import { Plus, CalendarBlank, Users, ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EventCard } from "@/components/events/event-card";
import { showToast } from "@/components/ui/toast";
import { isEventOnDay } from "@/lib/calendar-utils";
import type { EventFormData } from "@/components/events/event-form";

// Lazy load heavy modal components - only loaded when needed
const EventForm = lazy(() => import("@/components/events/event-form").then(m => ({ default: m.EventForm })));
const DeleteEventModal = lazy(() => import("@/components/events/delete-event-modal").then(m => ({ default: m.DeleteEventModal })));

const AUTO_REFRESH_STORAGE_KEY = "zawly-dashboard-auto-refresh";
const AUTO_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const AUTO_REFRESH_INTERVAL_SEC = 30 * 60;

interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  notes?: string;
  recurrence?: string;
  startTime?: string;
  assignees?: Array<{ id: string; name: string; src?: string | null }>;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
}

// Simple loading placeholder for suspended components
function ModalLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-text-primary/60 backdrop-blur-sm flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// Memoized empty state component
const EmptyState = memo(function EmptyState({ 
  isToday, 
  onCreate 
}: { 
  isToday: boolean; 
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-surface rounded-[--radius-md] border border-border animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mb-4">
        <CalendarBlank size={32} className="text-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">
        No events planned
      </h3>
      <p className="text-sm text-text-secondary text-center mb-4">
        {isToday 
          ? "Tap + to add something for today!"
          : "Nothing on this day. Add an event?"}
      </p>
      <Button onClick={onCreate} size="sm" leftIcon={<Plus size={16} />}>
        Add Event
      </Button>
    </div>
  );
});

// Memoized event list component
const EventList = memo(function EventList({ 
  events, 
  onEventClick 
}: { 
  events: Event[]; 
  onEventClick: (event: Event) => void;
}) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="animate-slide-up" style={{ animationDelay: "0ms" }}>
          <EventCard event={event} onEdit={() => onEventClick(event)} />
        </div>
      ))}
    </div>
  );
});

interface DashboardClientProps {
  initialEvents?: Event[];
  familyMembers?: FamilyMember[];
  hasFamily?: boolean | null;
}

export default function DashboardClient({ 
  initialEvents = [], 
  familyMembers: initialFamilyMembers = [],
  hasFamily: initialHasFamily = null
}: DashboardClientProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [loading, setLoading] = useState(initialEvents.length === 0);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [occurrenceDate, setOccurrenceDate] = useState<Date | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [hasFamily, setHasFamily] = useState<boolean | null>(initialHasFamily);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(AUTO_REFRESH_INTERVAL_SEC);

  // Load auto-refresh preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTO_REFRESH_STORAGE_KEY);
      if (stored !== null) setAutoRefreshEnabled(stored === "true");
    } catch { /* localStorage unavailable */ }
  }, []);

  // Fetch events on mount if not provided
  useEffect(() => {
    if (!isLoaded || initialEvents.length > 0) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    checkFamilyAndFetchEvents();
  }, [user, isLoaded, initialEvents.length, router]);

  const fetchEvents = useCallback(async (start?: Date, end?: Date) => {
    try {
      const startDate = start || addDays(startOfDay(new Date()), -7);
      const endDate = end || addDays(endOfDay(new Date()), 30);
      const res = await fetch(
        `/api/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      const data = await res.json();
      const parsedEvents = (data.events || []).map((event: Event & { startDate: string }) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : undefined,
      }));
      setEvents(parsedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, []);

  const checkFamilyAndFetchEvents = useCallback(async () => {
    try {
      const familyRes = await fetch("/api/family");
      const familyData = await familyRes.json();
      if (!familyData.hasFamily) {
        setHasFamily(false);
        return;
      }
      setHasFamily(true);
      setFamilyMembers(familyData.members || []);
      await fetchEvents();
    } catch (error) {
      console.error("Error checking family:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchEvents]);

  // Filter today's events - memoized
  const selectedDateEvents = useMemo(() => 
    events.filter(event => isEventOnDay(event, selectedDate)),
    [events, selectedDate]
  );

  // Calculate upcoming events - memoized
  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const rangeEnd = addDays(today, 30);
    const result: { event: Event; date: Date }[] = [];
    
    for (const event of events) {
      const isRecurring = event.recurrence && event.recurrence !== "none";
      const eventStart = startOfDay(new Date(event.startDate));

      if (!isRecurring) {
        if (eventStart >= tomorrow && eventStart <= rangeEnd) {
          result.push({ event, date: new Date(eventStart) });
        }
        continue;
      }

      let d = tomorrow;
      while (d <= rangeEnd) {
        if (isEventOnDay(event, d)) {
          result.push({ event, date: new Date(d) });
        }
        d = addDays(d, 1);
      }
    }
    result.sort((a, b) => a.date.getTime() - b.date.getTime());
    return result.slice(0, 10); // Limit to 10 upcoming events
  }, [events]);

  // Event handlers
  const handleCreateEvent = useCallback(async (data: EventFormData) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create event");
      showToast("success", "Event created successfully!");
      await fetchEvents();
      setShowEventForm(false);
    } catch {
      showToast("error", "Failed to create event. Please try again.");
    }
  }, [fetchEvents]);

  const handleEditEvent = useCallback(async (data: EventFormData) => {
    if (!editingEvent) return;
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingEvent.id, ...data }),
      });
      if (!res.ok) throw new Error("Failed to update event");
      showToast("success", "Event updated!");
      await fetchEvents();
      setEditingEvent(null);
    } catch {
      showToast("error", "Failed to update event. Please try again.");
    }
  }, [editingEvent, fetchEvents]);

  const handleDeleteEvent = useCallback(async (deleteAll: boolean) => {
    if (!deletingEvent) return;
    setDeleteLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      let url = `/api/events?id=${deletingEvent.id}&date=${dateStr}`;
      if (deleteAll) url += "&deleteAll=true";
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
      showToast("success", deleteAll ? "Event series deleted" : "Event deleted");
      await fetchEvents();
      setDeletingEvent(null);
    } catch {
      showToast("error", "Failed to delete event. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingEvent, selectedDate, fetchEvents]);

  const handleEventClick = useCallback((event: Event) => {
    setEditingEvent(event);
    setOccurrenceDate(selectedDate);
  }, [selectedDate]);

  const toggleAutoRefresh = useCallback((enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    try {
      localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, String(enabled));
    } catch { /* localStorage unavailable */ }
    if (enabled) setCountdownSeconds(AUTO_REFRESH_INTERVAL_SEC);
  }, []);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefreshEnabled) {
      setCountdownSeconds(AUTO_REFRESH_INTERVAL_SEC);
      return;
    }
    const interval = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          fetchEvents();
          return AUTO_REFRESH_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchEvents]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasFamily === false) {
    // Redirect to onboarding if no family
    router.push("/onboarding");
    return null;
  }

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Good {getGreeting()}, {user?.firstName || "there"} 👋
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-[--radius-md] bg-surface border border-border">
            <ArrowsClockwise
              size={16}
              className={autoRefreshEnabled ? "text-primary animate-spin" : "text-text-tertiary"}
              style={autoRefreshEnabled ? { animationDuration: '3s' } : undefined}
            />
            <Checkbox
              id="auto-refresh"
              checked={autoRefreshEnabled}
              onChange={toggleAutoRefresh}
              label={
                <span className="flex items-center gap-1">
                  Auto-refresh
                  {autoRefreshEnabled && (
                    <span className="text-xs text-text-tertiary font-mono">
                      {formatCountdown(countdownSeconds)}
                    </span>
                  )}
                </span>
              }
            />
          </div>
          <Button
            onClick={() => setShowEventForm(true)}
            className="hidden lg:flex"
            leftIcon={<Plus size={18} weight="bold" />}
          >
            New Event
          </Button>
        </div>
      </header>

      {/* Today's Events */}
      <section className="mb-8" style={{ contain: "layout style" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)] text-text-primary">
            {isSameDay(selectedDate, new Date()) ? "Today's Events" : format(selectedDate, "EEEE's Events")}
          </h2>
          <span className="text-sm text-text-tertiary">
            {selectedDateEvents.length} {selectedDateEvents.length === 1 ? "event" : "events"}
          </span>
        </div>

        {selectedDateEvents.length > 0 ? (
          <EventList events={selectedDateEvents} onEventClick={handleEventClick} />
        ) : (
          <EmptyState 
            isToday={isSameDay(selectedDate, new Date())} 
            onCreate={() => setShowEventForm(true)} 
          />
        )}
      </section>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section style={{ contain: "layout style" }}>
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)] text-text-primary mb-4">
            Coming Up
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map(({ event, date }) => (
              <div key={`${event.id}-${date.toISOString()}`} className="animate-slide-up">
                <EventCard 
                  event={event} 
                  showDate 
                  occurrenceDate={date} 
                  onEdit={() => handleEventClick(event)} 
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suspended Modals - only loaded when opened */}
      <Suspense fallback={<ModalLoading />}>
        <EventForm
          isOpen={showEventForm}
          onClose={() => setShowEventForm(false)}
          onSave={handleCreateEvent}
          defaultDate={selectedDate}
          mode="create"
        />
      </Suspense>

      <Suspense fallback={<ModalLoading />}>
        {editingEvent && (
          <EventForm
            isOpen={!!editingEvent}
            onClose={() => setEditingEvent(null)}
            onSave={handleEditEvent}
            onDelete={() => {
              setDeletingEvent(editingEvent);
              setEditingEvent(null);
            }}
            initialData={{
              title: editingEvent.title,
              startDate: occurrenceDate || editingEvent.startDate,
              endDate: editingEvent.endDate,
              allDay: editingEvent.allDay,
              notes: editingEvent.notes,
              recurrence: (editingEvent.recurrence as any) || "none",
            }}
            defaultDate={occurrenceDate || editingEvent.startDate}
            mode="edit"
          />
        )}
      </Suspense>

      <Suspense fallback={<ModalLoading />}>
        {deletingEvent && (
          <DeleteEventModal
            isOpen={!!deletingEvent}
            onClose={() => setDeletingEvent(null)}
            onConfirm={handleDeleteEvent}
            isRecurring={deletingEvent?.recurrence !== "none" && !!deletingEvent?.recurrence}
            eventTitle={deletingEvent?.title || ""}
            loading={deleteLoading}
          />
        )}
      </Suspense>
    </div>
  );
}

// Utility functions
function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
