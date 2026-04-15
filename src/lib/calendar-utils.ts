import { RRule } from "rrule";
import { toDateKey, toDateOnly, getDayOfWeek } from "./date-utils";

/**
 * Determines if an event occurs on a specific day.
 * Uses the industry-standard RRule library (RFC 5545), with a
 * direct-comparison fallback if RRule fails for any reason.
 * Respects excludedDates for recurring events.
 * 
 * IMPORTANT: All dates are treated as date-only (no time component).
 * This avoids timezone issues where a date can shift to the previous/next day.
 */
export function isEventOnDay(event: any, day: Date): boolean {
  // Convert everything to date-only to avoid timezone issues
  const start = toDateOnly(event.startDate);
  const end = event.endDate ? toDateOnly(event.endDate) : null;
  const target = toDateOnly(day);

  // Check if this date is excluded
  if (event.excludedDates && Array.isArray(event.excludedDates)) {
    const targetKey = toDateKey(day);
    if (event.excludedDates.includes(targetKey)) {
      return false;
    }
  }

  // Day must be on or after start, and on or before end
  if (target < start) return false;
  if (end && target > end) return false;

  // Non-recurring: exact date match
  if (!event.recurrence || event.recurrence === "none") {
    return start.getTime() === target.getTime();
  }

  // Try RRule first, fall back to direct comparison if it fails
  try {
    // Handle biweekly specially (weekly with interval 2)
    if (event.recurrence === "biweekly") {
      const rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 2,
        dtstart: start,
        until: end || undefined,
      });
      const nextOccurrence = rule.after(target, true);
      return nextOccurrence !== null && nextOccurrence.getTime() === target.getTime();
    }

    // Handle triweekly (every 3 weeks) - weekly with interval 3
    if (event.recurrence === "triweekly") {
      const rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 3,
        dtstart: start,
        until: end || undefined,
      });
      const nextOccurrence = rule.after(target, true);
      return nextOccurrence !== null && nextOccurrence.getTime() === target.getTime();
    }

    // Handle quadweekly (every 4 weeks) - weekly with interval 4
    if (event.recurrence === "quadweekly") {
      const rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 4,
        dtstart: start,
        until: end || undefined,
      });
      const nextOccurrence = rule.after(target, true);
      return nextOccurrence !== null && nextOccurrence.getTime() === target.getTime();
    }

    const freqMap: Record<string, number> = {
      daily: RRule.DAILY,
      weekly: RRule.WEEKLY,
      monthly: RRule.MONTHLY,
      yearly: RRule.YEARLY,
    };

    const freq = freqMap[event.recurrence];
    if (freq === undefined) return start.getTime() === target.getTime();

    const rule = new RRule({
      freq,
      dtstart: start,
      until: end || undefined,
    });

    const nextOccurrence = rule.after(target, true);
    return nextOccurrence !== null && nextOccurrence.getTime() === target.getTime();
  } catch (err) {
    // Fallback to direct comparison if RRule fails (SSR, bundling issue, etc.)
    console.warn("RRule failed, falling back to direct comparison:", err);
    return directComparison(event.recurrence, start, target);
  }
}

/** Direct date comparison fallback - used if RRule is unavailable */
function directComparison(recurrence: string, start: Date, day: Date): boolean {
  switch (recurrence) {
    case "daily":
      return true;
    case "weekly":
      return getDayOfWeek(start) === getDayOfWeek(day);
    case "biweekly": {
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const diffWeeks = Math.floor((day.getTime() - start.getTime()) / msPerWeek);
      return getDayOfWeek(start) === getDayOfWeek(day) && diffWeeks % 2 === 0;
    }
    case "triweekly": {
      const msPerWeekTri = 7 * 24 * 60 * 60 * 1000;
      const diffWeeksTri = Math.floor((day.getTime() - start.getTime()) / msPerWeekTri);
      return getDayOfWeek(start) === getDayOfWeek(day) && diffWeeksTri % 3 === 0;
    }
    case "quadweekly": {
      const msPerWeekQuad = 7 * 24 * 60 * 60 * 1000;
      const diffWeeksQuad = Math.floor((day.getTime() - start.getTime()) / msPerWeekQuad);
      return getDayOfWeek(start) === getDayOfWeek(day) && diffWeeksQuad % 4 === 0;
    }
    case "monthly":
      return start.getDate() === day.getDate();
    case "yearly":
      return start.getMonth() === day.getMonth() && start.getDate() === day.getDate();
    default:
      return start.getTime() === day.getTime();
  }
}
