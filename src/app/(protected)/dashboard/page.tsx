"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { format, isSameDay, startOfDay, endOfDay, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CalendarBlank, Users, ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EventCard } from "@/components/events/event-card";
import { EventForm, EventFormData } from "@/components/events/event-form";
import { DeleteEventModal } from "@/components/events/delete-event-modal";
import { showToast } from "@/components/ui/toast";
import { isEventOnDay } from "@/lib/calendar-utils";

const AUTO_REFRESH_STORAGE_KEY = "zawly-dashboard-auto-refresh";
const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

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

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [occurrenceDate, setOccurrenceDate] = useState<Date | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(30 * 60); // 30 minutes in seconds
  
  // Load auto-refresh preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTO_REFRESH_STORAGE_KEY);
      if (stored !== null) {
        setAutoRefreshEnabled(stored === "true");
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Auto-refresh interval and countdown

  // Save auto-refresh preference
  const toggleAutoRefresh = useCallback((enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    try {
      localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, String(enabled));
    } catch {
      // localStorage unavailable
    }
    if (enabled) {
      setLastRefreshed(new Date());
      setCountdownSeconds(30 * 60);
    }
  }, []);

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

  useEffect(() => {
    if (!autoRefreshEnabled) {
      setCountdownSeconds(30 * 60);
      return;
    }

    // Set initial countdown from last refresh or now
    if (lastRefreshed) {
      const elapsed = Date.now() - lastRefreshed.getTime();
      const remaining = Math.max(0, Math.ceil((AUTO_REFRESH_INTERVAL - elapsed) / 1000));
      setCountdownSeconds(remaining);
    } else {
      setCountdownSeconds(30 * 60);
    }

    // Countdown timer (every second)
    const countdownInterval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          return 30 * 60;
        }
        return prev - 1;
      });
    }, 1000);

    // Refresh timer (every 30 minutes)
    const refreshInterval = setInterval(() => {
      fetchEvents();
      setLastRefreshed(new Date());
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(refreshInterval);
    };
  }, [autoRefreshEnabled, fetchEvents, lastRefreshed]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    checkFamilyAndFetchEvents();
  }, [user, isLoaded]);

  const checkFamilyAndFetchEvents = async () => {
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
  };

  const handleCreateEvent = async (data: EventFormData) => {
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
  };

  const handleEditEvent = async (data: EventFormData) => {
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
  };

  const handleDeleteEvent = async (deleteAll: boolean) => {
    if (!deletingEvent) return;
    setDeleteLoading(true);
    try {
      // Use the selected date (the occurrence the user clicked on), not the event's original startDate.
      // For recurring events, startDate is always the first occurrence, but the user
      // may be deleting a later occurrence.
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
  };

  const handleEventClick = (event: Event, clickedDate?: Date) => {
    setEditingEvent(event);
    if (clickedDate) {
      setOccurrenceDate(clickedDate);
    } else {
      setOccurrenceDate(selectedDate);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Filter events for selected date
  const selectedDateEvents = events.filter(event => 
    isEventOnDay(event, selectedDate)
  );

  // Get upcoming events — all occurrences from tomorrow through 30 days from today
  const upcomingEvents: { event: Event; date: Date }[] = (() => {
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

      // For recurring events, walk each day and collect all occurrences
      let d = tomorrow;
      while (d <= rangeEnd) {
        if (isEventOnDay(event, d)) {
          result.push({ event, date: new Date(d) });
        }
        d = addDays(d, 1);
      }
    }
    result.sort((a, b) => a.date.getTime() - b.date.getTime());
    return result;
  })();

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
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <FamilySetup userId={user?.id || ""} onComplete={checkFamilyAndFetchEvents} />
      </div>
    );
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
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)] text-text-primary">
            {isSameDay(selectedDate, new Date()) ? "Today's Events" : format(selectedDate, "EEEE's Events")}
          </h2>
          <span className="text-sm text-text-tertiary">
            {selectedDateEvents.length} {selectedDateEvents.length === 1 ? "event" : "events"}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {selectedDateEvents.length > 0 ? (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {selectedDateEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <EventCard event={event} onClick={() => handleEventClick(event)} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 px-6 bg-surface rounded-[--radius-md] border border-border"
            >
              <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mb-4">
                <CalendarBlank size={32} className="text-text-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                No events planned
              </h3>
              <p className="text-sm text-text-secondary text-center mb-4">
                {isSameDay(selectedDate, new Date()) 
                  ? "Tap + to add something for today!"
                  : "Nothing on this day. Add an event?"}
              </p>
              <Button
                onClick={() => setShowEventForm(true)}
                size="sm"
                leftIcon={<Plus size={16} />}
              >
                Add Event
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)] text-text-primary mb-4">
            Coming Up
          </h2>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {upcomingEvents.map(({ event, date }, i) => (
                <motion.div
                  key={`${event.id}-${date.toISOString()}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <EventCard event={event} showDate occurrenceDate={date} onClick={() => handleEventClick(event, date)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Create Event Modal */}
      <EventForm
        isOpen={showEventForm}
        onClose={() => setShowEventForm(false)}
        onSave={handleCreateEvent}
        defaultDate={selectedDate}
        mode="create"
      />

      {/* Edit Event Modal */}
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

      {/* Delete Confirmation Modal */}
      <DeleteEventModal
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleDeleteEvent}
        isRecurring={deletingEvent?.recurrence !== "none" && !!deletingEvent?.recurrence}
        eventTitle={deletingEvent?.title || ""}
        loading={deleteLoading}
      />
    </div>
  );
}

function formatCountdown(seconds: number): string {
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

// Family Setup Component
function FamilySetup({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!familyName.trim()) {
      setError("Please enter a family name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", familyName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create family");
      }
      showToast("success", "Family created successfully!");
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || inviteCode.length !== 6) {
      setError("Please enter a valid 6-character invite code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", inviteCode: inviteCode.toUpperCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join family");
      }
      showToast("success", "Joined family successfully!");
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="bg-surface rounded-[--radius-lg] border border-border p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <Users size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Welcome to Zawly Calendar! 👋
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            Create or join a family to get started
          </p>
        </div>

        {mode === "choose" && (
          <div className="space-y-3">
            <Button onClick={() => setMode("create")} variant="primary" className="w-full">
              Create a Family
            </Button>
            <Button onClick={() => setMode("join")} variant="secondary" className="w-full">
              Join an Existing Family
            </Button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Family Name</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="The Smiths"
                className="w-full h-12 px-4 rounded-[--radius-sm] border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-3">
              <Button onClick={() => setMode("choose")} variant="ghost" className="flex-1">Back</Button>
              <Button onClick={handleCreate} variant="primary" loading={loading} className="flex-1">Create</Button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full h-12 px-4 text-center text-2xl tracking-widest rounded-[--radius-sm] border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-3">
              <Button onClick={() => setMode("choose")} variant="ghost" className="flex-1">Back</Button>
              <Button onClick={handleJoin} variant="primary" loading={loading} className="flex-1">Join</Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}