import { RRule } from "rrule";

/**
 * Determines if an event occurs on a specific day.
 * Uses the industry-standard RRule library (RFC 5545), with a
 * direct-comparison fallback if RRule fails for any reason.
 * Respects excludedDates for recurring events.
 */
export function isEventOnDay(event: any, day: Date): boolean {
  const rawStart = new Date(event.startDate);
  const rawEnd = event.endDate ? new Date(event.endDate) : null;

  // Normalize everything to midnight (date-only) to avoid timezone drift
  const start = stripTime(rawStart);
  const end = rawEnd ? stripTime(rawEnd) : null;
  const target = stripTime(day);

  // Check if this date is excluded
  if (event.excludedDates && Array.isArray(event.excludedDates)) {
    const targetStr = target.toISOString().split("T")[0];
    if (event.excludedDates.includes(targetStr)) {
      return false;
    }
  }

  // Day must be on or after start, and on or before end
  if (target < start) return false;
  if (end && target > end) return false;

  // Non-recurring: exact date match
  if (!event.recurrence || event.recurrence === "none") {
    return target.getTime() === start.getTime();
  }

  // Try RRule first, fall back to direct comparison if it fails
  try {
    const freqMap: Record<string, number> = {
      daily: RRule.DAILY,
      weekly: RRule.WEEKLY,
      monthly: RRule.MONTHLY,
      yearly: RRule.YEARLY,
    };

    const freq = freqMap[event.recurrence];
    if (freq === undefined) return target.getTime() === start.getTime();

    const rule = new RRule({
      freq,
      dtstart: start,
      until: end || undefined,
    });

    const nextOccurrence = rule.after(target, true);
    return nextOccurrence !== null && nextOccurrence.toDateString() === target.toDateString();
  } catch (err) {
    // Fallback to direct comparison if RRule fails (SSR, bundling issue, etc.)
    console.warn("RRule failed, falling back to direct comparison:", err);
    return directComparison(event.recurrence, start, target);
  }
}

/** Direct date comparison fallback — used if RRule is unavailable */
function directComparison(recurrence: string, start: Date, day: Date): boolean {
  switch (recurrence) {
    case "daily":
      return true;
    case "weekly":
      return start.getDay() === day.getDay();
    case "monthly":
      return start.getDate() === day.getDate();
    case "yearly":
      return start.getMonth() === day.getMonth() && start.getDate() === day.getDate();
    default:
      return start.getTime() === day.getTime();
  }
}

/** Strip time, returning a Date at midnight local time */
function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}