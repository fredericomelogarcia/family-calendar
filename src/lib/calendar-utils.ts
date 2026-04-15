import { RRule, Weekday } from "rrule";

/**
 * Determines if an event occurs on a specific day.
 * Uses the industry-standard RRule library (RFC 5545), with a
 * direct-comparison fallback if RRule fails for any reason.
 * Respects excludedDates for recurring events.
 */
export function isEventOnDay(event: any, day: Date): boolean {
  const rawStart = new Date(event.startDate);
  const rawEnd = event.endDate ? new Date(event.endDate) : null;

  // CRITICAL: Use UTC date components to preserve the intended day
  // Event dates are stored in UTC, but we need the same calendar day in local time
  const start = new Date(rawStart.getUTCFullYear(), rawStart.getUTCMonth(), rawStart.getUTCDate());
  const end = rawEnd ? new Date(rawEnd.getUTCFullYear(), rawEnd.getUTCMonth(), rawEnd.getUTCDate()) : null;
  const target = stripTime(day);

  // Check if this date is excluded
  if (event.excludedDates && Array.isArray(event.excludedDates)) {
    // Use local time components to build the date string, matching how
    // excludedDates are stored (via date-fns format() which uses local time).
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const d = String(target.getDate()).padStart(2, "0");
    const targetStr = `${y}-${m}-${d}`;
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
    // Handle biweekly specially (weekly with interval 2)
    if (event.recurrence === "biweekly") {
      const rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 2,
        dtstart: start,
        until: end || undefined,
      });
      // Compare using time values to avoid timezone issues
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
    if (freq === undefined) return target.getTime() === start.getTime();

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

/** Direct date comparison fallback — used if RRule is unavailable */
function directComparison(recurrence: string, start: Date, day: Date): boolean {
  switch (recurrence) {
    case "daily":
      return true;
    case "weekly":
      return start.getDay() === day.getDay();
    case "biweekly": {
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const diffWeeks = Math.floor((day.getTime() - start.getTime()) / msPerWeek);
      return start.getDay() === day.getDay() && diffWeeks % 2 === 0;
    }
    case "triweekly": {
      const msPerWeekTri = 7 * 24 * 60 * 60 * 1000;
      const diffWeeksTri = Math.floor((day.getTime() - start.getTime()) / msPerWeekTri);
      return start.getDay() === day.getDay() && diffWeeksTri % 3 === 0;
    }
    case "quadweekly": {
      const msPerWeekQuad = 7 * 24 * 60 * 60 * 1000;
      const diffWeeksQuad = Math.floor((day.getTime() - start.getTime()) / msPerWeekQuad);
      return start.getDay() === day.getDay() && diffWeeksQuad % 4 === 0;
    }
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