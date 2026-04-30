import { toDateKey, toDateOnly, getDayOfWeek } from "./date-utils";

/**
 * Determines if an event occurs on a specific day.
 * 
 * IMPORTANT: Uses simple date math instead of RRule to avoid timezone issues.
 * All dates are treated as date-only (no time component).
 */
export function isEventOnDay(event: any, day: Date): boolean {
  // Convert everything to date-only to avoid timezone issues
  const start = toDateOnly(event.startDate);
  const end = event.endDate ? toDateOnly(event.endDate) : null;
  const recurrenceEnd = event.recurrenceEndDate ? toDateOnly(event.recurrenceEndDate) : null;
  const target = toDateOnly(day);

  // Check if this date is excluded
  if (event.excludedDates && Array.isArray(event.excludedDates)) {
    const targetKey = toDateKey(day);
    if (event.excludedDates.includes(targetKey)) {
      return false;
    }
  }

  // Day must be on or after start, and on or before end (or recurrenceEnd)
  if (target < start) return false;
  if (end && target > end) return false;
  if (recurrenceEnd && target > recurrenceEnd) return false;

  // Non-recurring: exact date match
  if (!event.recurrence || event.recurrence === "none") {
    return start.getTime() === target.getTime();
  }

  // Use direct comparison for all recurrence types (avoids RRule timezone bugs)
  return directComparison(event.recurrence, start, target);
}

/** Direct date comparison - calculates recurring events without timezone issues */
function directComparison(recurrence: string, start: Date, day: Date): boolean {
  // Get day of week using UTC-aware function
  const startDayOfWeek = getDayOfWeek(start);
  const targetDayOfWeek = getDayOfWeek(day);
  
  switch (recurrence) {
    case "daily":
      return true;
    
    case "weekly":
      // Same day of week
      return startDayOfWeek === targetDayOfWeek;
    
    case "biweekly": {
      // Same day of week, and difference in weeks is even
      if (startDayOfWeek !== targetDayOfWeek) return false;
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const diffWeeks = Math.round((day.getTime() - start.getTime()) / msPerWeek);
      return diffWeeks % 2 === 0;
    }
    
    case "triweekly": {
      // Same day of week, and difference in weeks is multiple of 3
      if (startDayOfWeek !== targetDayOfWeek) return false;
      const msPerWeekTri = 7 * 24 * 60 * 60 * 1000;
      const diffWeeksTri = Math.round((day.getTime() - start.getTime()) / msPerWeekTri);
      return diffWeeksTri % 3 === 0;
    }
    
    case "quadweekly": {
      // Same day of week, and difference in weeks is multiple of 4
      if (startDayOfWeek !== targetDayOfWeek) return false;
      const msPerWeekQuad = 7 * 24 * 60 * 60 * 1000;
      const diffWeeksQuad = Math.round((day.getTime() - start.getTime()) / msPerWeekQuad);
      return diffWeeksQuad % 4 === 0;
    }
    
    case "monthly":
      // Same date of month
      return start.getDate() === day.getDate();
    
    case "yearly":
      // Same month and date
      return start.getMonth() === day.getMonth() && start.getDate() === day.getDate();
    
    default:
      return start.getTime() === day.getTime();
  }
}
