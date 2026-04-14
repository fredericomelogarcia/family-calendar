"use client";

import { isEventOnDay } from "@/lib/calendar-utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CalendarBlank, Clock } from "@phosphor-icons/react";
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
  }>;
  onCreateEvent: () => void;
  onEventClick?: (event: any) => void;
}

export function DayView({ selectedDate, events, onCreateEvent, onEventClick }: DayViewProps) {
  const selectedDateEvents = events.filter(event => 
    isEventOnDay(event, selectedDate)
  );

  return (
    <div className="flex flex-col h-full">
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
        <AnimatePresence mode="popLayout">
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <EventCard 
                    event={event} 
                    onClick={onEventClick ? () => onEventClick(event) : undefined}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 px-6 bg-surface-alt rounded-[--radius-md] border border-border border-dashed text-center"
            >
              <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3">
                <CalendarBlank size={24} className="text-text-tertiary" />
              </div>
              <p className="text-sm text-text-secondary">
                No events for this day.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}