/**
 * Date utility functions that work with dates only (no time component)
 * All dates are normalized to midnight UTC to avoid timezone issues
 */

/**
 * Convert a Date or date string to a date-only key (YYYY-MM-DD)
 * This ensures consistent date comparison regardless of time/timezone
 */
export function toDateKey(date: Date | string): string {
  let d: Date;
  if (typeof date === "string") {
    // If it's an ISO string, we treat it as a local date to avoid timezone shifts
    // e.g. "2026-04-15T00:00:00Z" -> "2026-04-15"
    if (date.includes("T")) {
      const [datePart] = date.split("T");
      d = new Date(`${datePart}T00:00:00`);
    } else {
      // For YYYY-MM-DD strings, new Date() treats them as UTC, 
      // we want local midnight.
      d = new Date(date + "T00:00:00");
    }
  } else {
    d = date;
  }

  // Use local components
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Create a date-only Date object (midnight local time, but representing the UTC date)
 */
export function toDateOnly(date: Date | string): Date {
  const key = toDateKey(date);
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get day of week (0-6) from a date, accounting for timezone issues
 */
export function getDayOfWeek(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  // Create the date using UTC components converted to local
  const dateOnly = toDateOnly(d);
  return dateOnly.getDay();
}

/**
 * Check if two dates represent the same calendar day
 */
export function isSameDate(a: Date | string, b: Date | string): boolean {
  return toDateKey(a) === toDateKey(b);
}