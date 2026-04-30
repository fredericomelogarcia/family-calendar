"use client";

import { useState, useCallback, useMemo, useEffect, Suspense, lazy, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  setMonth,
  setYear,
  addDays,
} from "date-fns";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { MonthGrid } from "@/components/calendar/month-grid";
import { DayView } from "@/components/calendar/day-view";
import { showToast } from "@/components/ui/toast";
import type { EventFormData } from "@/components/events/event-form";

// Lazy load modal components
const EventForm = lazy(() => import("@/components/events/event-form").then(m => ({ default: m.EventForm })));
const DeleteEventModal = lazy(() => import("@/components/events/delete-event-modal").then(m => ({ default: m.DeleteEventModal })));

interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  notes?: string;
  recurrence?: EventFormData["recurrence"];
  excludedDates?: string[];
  isHoliday?: boolean;
  recurrenceEndDate?: Date;
}

interface CalendarClientProps {
  initialEvents: Event[];
  hasFamily: boolean;
}

// Simple loading placeholder
function ModalLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-text-primary/60 backdrop-blur-sm flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

export default function CalendarClient({ initialEvents, hasFamily: initialHasFamily }: CalendarClientProps) {
  const router = useRouter();

  // Extract and store holidays from initial events
  const holidaysRef = useRef<Event[]>(
    initialEvents.filter(e => e.isHoliday)
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [occurrenceDate, setOccurrenceDate] = useState<Date | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch events when month changes
  const fetchEvents = useCallback(async () => {
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const res = await fetch(
        `/api/events?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`
      );
      const data = await res.json();
      const parsedEvents = (data.events || []).map((event: Event & { startDate: string }) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        recurrenceEndDate: event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : undefined,
      }));
      
      // Merge holidays with fetched family events
      const holidays = holidaysRef.current;
      setEvents([...parsedEvents, ...holidays]);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, [currentDate]);

  // Only fetch when navigating to a different month (not on initial mount)
  const hasFetchedInitialRef = useRef(true);

  useEffect(() => {
    if (hasFetchedInitialRef.current) {
      hasFetchedInitialRef.current = false;
      return;
    }
    fetchEvents();
  }, [currentDate, fetchEvents]);

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

  const handleEditEvent = useCallback(async (data: EventFormData, options?: { clearExcludedDates?: boolean }) => {
    if (!editingEvent) return;
    try {
      const body: Record<string, unknown> = { id: editingEvent.id, ...data };
      if (options?.clearExcludedDates) {
        body.excludedDates = null;
      }
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const navigatePrevious = useCallback(() => setCurrentDate(prev => subMonths(prev, 1)), []);
  const navigateNext = useCallback(() => setCurrentDate(prev => addMonths(prev, 1)), []);
  const goToToday = useCallback(() => { 
    setCurrentDate(new Date()); 
    setSelectedDate(new Date()); 
  }, []);

  // Month/year change handlers
  const handleMonthChange = useCallback((i: number) => 
    setCurrentDate(prev => setMonth(prev, i)), 
  []);
  
  const handleYearChange = useCallback((y: number) => 
    setCurrentDate(prev => setYear(prev, y)), 
  []);

  // Memoized month/year arrays to prevent recalculation
  const months = useMemo(() => [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ], []);
  
  const years = useMemo(() =>
    Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i),
  []);

  if (!initialHasFamily) {
    router.push("/onboarding");
    return null;
  }

  // Remove redundant auth check: this is handled by proxy.ts
  if (!initialHasFamily) {
    // Redirect to onboarding if no family
    router.push("/onboarding");
    return null;
  }

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8 lg:max-w-[60vw]">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center justify-center lg:justify-start gap-4">
          <div className="flex items-center gap-2 bg-surface rounded-[--radius-md] border border-border p-1">
            <button 
              onClick={navigatePrevious} 
              className="p-2 rounded-[--radius-sm] hover:bg-surface-alt transition-colors active:scale-95" 
              title="Previous Month"
            >
              <CaretLeft size={20} className="text-text-primary" />
            </button>
            <div className="flex items-center gap-1 px-2">
              <label htmlFor="month-select" className="sr-only">Month</label>
              <select 
                id="month-select"
                value={currentDate.getMonth()} 
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                className="bg-transparent font-bold text-lg text-text-primary focus:outline-none cursor-pointer hover:text-primary transition-colors appearance-none pr-4"
              >
                {months.map((month, i) => (
                  <option key={month} value={i} className="bg-surface text-text-primary">{month}</option>
                ))}
              </select>
              <label htmlFor="year-select" className="sr-only">Year</label>
              <select 
                id="year-select"
                value={currentDate.getFullYear()} 
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="bg-transparent font-bold text-lg text-text-primary focus:outline-none cursor-pointer hover:text-primary transition-colors appearance-none pr-4"
              >
                {years.map(year => (
                  <option key={year} value={year} className="bg-surface text-text-primary">{year}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={navigateNext} 
              className="p-2 rounded-[--radius-sm] hover:bg-surface-alt transition-colors active:scale-95" 
              title="Next Month"
            >
              <CaretRight size={20} className="text-text-primary" />
            </button>
          </div>
          <button 
            onClick={goToToday} 
            className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-[--radius-sm] transition-colors active:scale-95"
          >
            Today
          </button>
        </div>
      </header>

      {/* Main Content Grid - Removed framer-motion wrapper */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="bg-surface rounded-[--radius-lg] border border-border p-4 lg:p-6 w-full xl:flex-1 animate-fade-in">
<MonthGrid 
              currentMonth={currentDate} 
              selectedDate={selectedDate} 
              onSelectDate={setSelectedDate} 
              events={events}
            />
        </div>

        <div className="w-full xl:w-[340px] xl:flex-shrink-0 flex flex-col">
          <div className="animate-slide-up">
            <DayView
              selectedDate={selectedDate}
              events={events}
              onCreateEvent={() => setShowEventForm(true)}
              onEventClick={handleEventClick}
            />
          </div>
        </div>
      </div>

      {/* Suspended Modals */}
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
              startDate: editingEvent.startDate,
              endDate: editingEvent.endDate,
              allDay: editingEvent.allDay,
              notes: editingEvent.notes,
              recurrence: editingEvent.recurrence || "none",
            }}
            defaultDate={occurrenceDate || editingEvent.startDate}
            mode="edit"
            disableDate={!!(editingEvent.recurrence && editingEvent.recurrence !== "none")}
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
