"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameDay,
  startOfDay,
  setMonth,
  setYear,
} from "date-fns";
import { motion } from "framer-motion";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { MonthGrid } from "@/components/calendar/month-grid";
import { isEventOnDay } from "@/lib/calendar-utils";
import { DayView } from "@/components/calendar/day-view";
import { EventForm, EventFormData } from "@/components/events/event-form";
import { DeleteEventModal } from "@/components/events/delete-event-modal";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  color: string;
  notes?: string;
  recurrence?: string;
  excludedDates?: string[];
  assignees?: Array<{ id: string; name: string; src?: string | null }>;
}

export default function CalendarPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);

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
      await fetchEvents();
    } catch (error) {
      console.error("Error checking family:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
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
      }));
      setEvents(parsedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    if (hasFamily) fetchEvents();
  }, [currentDate, hasFamily]);

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
      const dateStr = format(deletingEvent.startDate, "yyyy-MM-dd");
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

  const handleEventClick = (event: Event) => {
    setEditingEvent(event);
  };

  const navigatePrevious = () => setCurrentDate(subMonths(currentDate, 1));
  const navigateNext = () => setCurrentDate(addMonths(currentDate, 1));
  const handleMonthChange = (i: number) => setCurrentDate(setMonth(currentDate, i));
  const handleYearChange = (y: number) => setCurrentDate(setYear(currentDate, y));
  const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date()); };

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
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">No Family Found</h2>
          <p className="text-text-secondary mb-4">Please set up your family first.</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8 lg:max-w-[60vw]">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center justify-center lg:justify-start gap-4">
          <div className="flex items-center gap-2 bg-surface rounded-[--radius-md] border border-border p-1">
            <button onClick={navigatePrevious} className="p-2 rounded-[--radius-sm] hover:bg-surface-alt transition-colors" title="Previous Month">
              <CaretLeft size={20} className="text-text-primary" />
            </button>
            <div className="flex items-center gap-1 px-2">
              <select value={currentDate.getMonth()} onChange={(e) => handleMonthChange(parseInt(e.target.value))} className="bg-transparent font-bold text-lg text-text-primary focus:outline-none cursor-pointer hover:text-primary transition-colors appearance-none pr-4">
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((month, i) => (
                  <option key={month} value={i} className="bg-surface text-text-primary">{month}</option>
                ))}
              </select>
              <select value={currentDate.getFullYear()} onChange={(e) => handleYearChange(parseInt(e.target.value))} className="bg-transparent font-bold text-lg text-text-primary focus:outline-none cursor-pointer hover:text-primary transition-colors appearance-none pr-4">
                {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i).map(year => (
                  <option key={year} value={year} className="bg-surface text-text-primary">{year}</option>
                ))}
              </select>
            </div>
            <button onClick={navigateNext} className="p-2 rounded-[--radius-sm] hover:bg-surface-alt transition-colors" title="Next Month">
              <CaretRight size={20} className="text-text-primary" />
            </button>
          </div>
          <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-[--radius-sm] transition-colors">
            Today
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex flex-col xl:flex-row gap-6">
        <motion.div
          key={`${format(currentDate, "yyyy-MM")}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-surface rounded-[--radius-lg] border border-border p-4 lg:p-6 w-full xl:flex-1"
        >
          <MonthGrid currentMonth={currentDate} selectedDate={selectedDate} onSelectDate={(date) => setSelectedDate(date)} events={events} />
        </motion.div>

        <div className="w-full xl:w-[340px] xl:flex-shrink-0 flex flex-col">
          <motion.div
            key={selectedDate.toDateString()}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DayView
              selectedDate={selectedDate}
              events={events}
              onCreateEvent={() => setShowEventForm(true)}
              onEventClick={handleEventClick}
            />
          </motion.div>
        </div>
      </div>

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
            startDate: editingEvent.startDate,
            endDate: editingEvent.endDate,
            allDay: editingEvent.allDay,
            color: editingEvent.color,
            notes: editingEvent.notes,
            recurrence: (editingEvent.recurrence as any) || "none",
          }}
          defaultDate={editingEvent.startDate}
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