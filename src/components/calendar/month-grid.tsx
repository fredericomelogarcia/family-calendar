"use client";

import { cn } from "@/lib/utils";
import { isEventOnDay } from "@/lib/calendar-utils";
import { toDateKey } from "@/lib/date-utils";
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
import { memo, useMemo } from "react";

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
    isHoliday?: boolean;
  }>;
}

interface DayCellProps {
  day: Date;
  dayEvents: Array<{ id: string; isHoliday?: boolean }>;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isDayToday: boolean;
  onSelectDate: (date: Date) => void;
}

// Memoized day cell to prevent unnecessary re-renders
const DayCell = memo(function DayCell({
  day,
  dayEvents,
  isCurrentMonth,
  isSelected,
  isDayToday,
  onSelectDate,
}: DayCellProps) {
  const hasEvents = dayEvents.length > 0;
  const hasHoliday = dayEvents.some(e => e.isHoliday);

  return (
    <button
      onClick={() => onSelectDate(day)}
      className={cn(
        "aspect-square lg:aspect-auto lg:h-24 flex flex-col items-center justify-center rounded-[--radius-sm]",
        "transition-colors duration-150 hover:bg-surface-alt active:scale-95 will-change-transform",
        !isCurrentMonth && "text-text-secondary bg-surface-alt/50",
        isSelected && "bg-primary text-white",
        isDayToday && !isSelected && "ring-2 ring-primary ring-inset"
      )}
    >
      <span
        className={cn(
          "text-sm font-medium",
          isSelected && "text-white",
          !isSelected && "text-text-primary"
        )}
      >
        {format(day, "d")}
      </span>
      
      {/* Event indicators */}
      <div className="h-1.5 mt-1 flex items-center justify-center gap-1">
        {hasEvents && !hasHoliday && (
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        )}
        {hasHoliday && (
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        )}
      </div>
    </button>
  );
});

// Memoized grid component
export const MonthGrid = memo(function MonthGrid({ currentMonth, selectedDate, onSelectDate, events }: MonthGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = useMemo(() => 
    eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );
  
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Memoize events lookup - includes both regular events and holidays
  const eventsByDay = useMemo(() => {
    return days.reduce((acc, day) => {
      acc[toDateKey(day)] = events.filter(event => 
        isEventOnDay(event, day)
      );
      return acc;
    }, {} as Record<string, typeof events>);
  }, [days, events]);

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
      <div 
        className="grid grid-cols-7 gap-1 animate-fade-in"
        style={{ contain: "layout style paint" }}
      >
        {days.map((day) => {
          const dayKey = toDateKey(day);
          const dayEvents = eventsByDay[dayKey] || [];
          
          return (
            <DayCell
              key={dayKey}
              day={day}
              dayEvents={dayEvents}
              isCurrentMonth={isSameMonth(day, currentMonth)}
              isSelected={isSameDay(day, selectedDate)}
              isDayToday={isToday(day)}
              onSelectDate={onSelectDate}
            />
          );
        })}
      </div>
    </div>
  );
});
