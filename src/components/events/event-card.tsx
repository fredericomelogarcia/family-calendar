"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    startDate: Date | string;
    endDate?: Date | string | null;
    allDay?: boolean;
    notes?: string | null;
  };
  showDate?: boolean;
  /** The actual occurrence date to display (differs from event.startDate for recurring events) */
  occurrenceDate?: Date;
  onClick?: () => void;
  onLongPress?: () => void;
}

export function EventCard({ event, showDate, occurrenceDate, onClick, onLongPress }: EventCardProps) {
  const startDate = new Date(event.startDate);
  const displayDate = occurrenceDate || startDate;
  const isAllDay = event.allDay ?? true;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress?.();
      }}
      className={cn(
        "w-full text-left p-4 rounded-[--radius-md] bg-surface border border-border",
        "hover:shadow-sm hover:border-text-tertiary transition-all duration-150",
        "flex gap-4 items-start",
        onClick && "cursor-pointer"
      )}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-text-primary truncate">
          {event.title}
        </h3>
        
        <div className="flex items-center gap-2 mt-1.5">
          <span className={cn(
            "text-xs font-mono",
            isAllDay ? "text-text-secondary" : "text-text-tertiary"
          )}>
            {showDate && format(displayDate, "EEEE, MMMM d") + " · "}
            {isAllDay 
              ? "All day" 
              : format(startDate, "h:mm a")
            }
          </span>
          
          {event.notes && (
            <span className="text-xs text-text-tertiary truncate">
              · {event.notes}
            </span>
          )}
        </div>

      </div>

      {/* Chevron (only when clickable) */}
      {onClick && (
        <svg 
          className="w-5 h-5 text-text-tertiary flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </motion.button>
  );
}