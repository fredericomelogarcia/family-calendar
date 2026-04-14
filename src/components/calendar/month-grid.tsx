"use client";

import { cn } from "@/lib/utils";
import { isEventOnDay } from "@/lib/calendar-utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from "date-fns";
import { motion } from "framer-motion";

interface MonthGridProps {
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: Array<{
    id: string;
    title?: string;
    startDate: Date;
    recurrence?: string;
    endDate?: Date;
    allDay?: boolean;
    notes?: string;
  }>;
}

export function MonthGrid({ currentMonth, selectedDate, onSelectDate, events }: MonthGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group events by day
  const eventsByDay = days.reduce((acc, day) => {
    acc[day.toISOString()] = events.filter(event => 
      isEventOnDay(event, day)
    );
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <div className="select-none w-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-text-tertiary py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = eventsByDay[day.toISOString()] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);
          const hasEvents = dayEvents.length > 0;

          return (
            <motion.button
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01, duration: 0.15 }}
              onClick={() => onSelectDate(day)}
              className={cn(
                "aspect-square lg:aspect-auto lg:h-24 flex flex-col items-center justify-center rounded-[--radius-sm] transition-all duration-150",
                "hover:bg-surface-alt active:scale-95",
                !isCurrentMonth && "opacity-40",
                isSelected && "bg-primary text-white",
                isDayToday && !isSelected && "ring-2 ring-primary ring-inset"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  isSelected && "text-white",
                  !isCurrentMonth && "text-text-tertiary",
                  !isSelected && isCurrentMonth && "text-text-primary"
                )}
              >
                {format(day, "d")}
              </span>
              
              {/* Event indicator dot - always reserve space so number stays aligned */}
              <div className="h-1.5 mt-1 flex items-center justify-center">
                {hasEvents && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}