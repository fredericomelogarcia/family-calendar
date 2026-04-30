"use client";

import { isEventOnDay } from "@/lib/calendar-utils";
import { format } from "date-fns";
import { useMemo, memo } from "react";
import { Plus, CalendarBlank } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/event-card";
import { cn } from "@/lib/utils";

interface DayViewProps {
  selectedDate: Date;
  events: Array<{
    id: string;
    title: string;
    startDate: Date;
    endDate?: Date;
    allDay: boolean;
    notes?: string;
    recurrence?: string;
    excludedDates?: string[];
    isHoliday?: boolean;
  }>;
  onCreateEvent: () => void;
  onEventClick?: (event: any) => void;
}

// Memoized event list to prevent unnecessary re-renders
const EventList = memo(function EventList({ 
  events, 
  onEventClick 
}: { 
  events: any[]; 
  onEventClick?: (event: any) => void;
}) {
  return (
    <div className="space-y-3">
      {events.map((event, i) => (
        <div 
          key={event.id} 
          className="animate-slide-up"
          style={{ animationDelay: `${Math.min(i * 30, 150)}ms` }}
        >
          <EventCard 
            event={event} 
            onEdit={onEventClick ? () => onEventClick(event) : undefined}
          />
        </div>
      ))}
    </div>
  );
});

export const DayView = memo(function DayView({ selectedDate, events, onCreateEvent, onEventClick }: DayViewProps) {
  // Memoize events filtering
  const selectedDateEvents = useMemo(() => 
    events.filter(event => isEventOnDay(event, selectedDate)),
    [events, selectedDate]
  );

  return (
    <div className="flex flex-col h-full" style={{ contain: "layout style" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            {format(selectedDate, "EEEE, MMM d")}
          </h2>
          <p className="text-sm text-text-secondary">
            {selectedDateEvents.length} {selectedDateEvents.length === 1 ? "event" : "events"} scheduled
          </p>
        </div>
        <Button
          onClick={onCreateEvent}
          size="sm"
          leftIcon={<Plus size={16} weight="bold" />}
          className="flex-shrink-0"
        >
          New Event
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {selectedDateEvents.length > 0 ? (
          <EventList events={selectedDateEvents} onEventClick={onEventClick} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-surface-alt rounded-[--radius-md] border border-border border-dashed text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3">
              <CalendarBlank size={24} className="text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary">
              No events for this day.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});