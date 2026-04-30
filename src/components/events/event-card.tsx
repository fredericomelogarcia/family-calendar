"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { memo } from "react";
import { PencilSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    startDate: Date | string;
    endDate?: Date | string | null;
    allDay?: boolean;
    startTime?: string | null;
    endTime?: string | null;
    notes?: string | null;
    isHoliday?: boolean;
  };
  showDate?: boolean;
  /** The actual occurrence date to display (differs from event.startDate for recurring events) */
  occurrenceDate?: Date;
  onEdit?: () => void;
  onLongPress?: () => void;
}

export const EventCard = memo(function EventCard({ 
  event, 
  showDate, 
  occurrenceDate, 
  onEdit, 
  onLongPress 
}: EventCardProps) {
  const startDate = new Date(event.startDate);
  const displayDate = occurrenceDate || startDate;
  const isAllDay = event.allDay ?? true;
  const isHoliday = event.isHoliday ?? false;
  const hasStartTime = event.startTime && !isAllDay;
  const hasEndTime = event.endTime && !isAllDay;

  const timeDisplay = isAllDay 
    ? "All day" 
    : hasEndTime 
      ? `${event.startTime} - ${event.endTime}`
      : format(startDate, "h:mm a");

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress?.();
      }}
      className={cn(
        "w-full p-4 rounded-[--radius-md] bg-surface border border-border",
        "flex gap-4 items-center",
        isHoliday && "border-blue-300 bg-blue-50/50"
      )}
    >
      {/* Content - takes available space */}
      <div className="flex-1 min-w-0">
        <h3 className={cn("font-semibold truncate", isHoliday ? "text-blue-700" : "text-text-primary")}>
          {event.title}
        </h3>
        
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            "text-xs font-mono",
            isAllDay ? "text-text-secondary" : "text-text-tertiary"
          )}>
            {showDate && format(displayDate, "EEEE, MMMM d") + " · "}
            {timeDisplay}
          </span>
          
          {event.notes && (
            <span className="text-xs text-text-tertiary truncate">
              · {event.notes}
            </span>
          )}
        </div>
      </div>

      {/* Edit Button on the right - hide for holidays */}
      {onEdit && !isHoliday && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex-shrink-0 p-2 h-auto"
          aria-label="Edit event"
        >
          <PencilSimple size={18} weight="bold" />
        </Button>
      )}
    </div>
  );
});