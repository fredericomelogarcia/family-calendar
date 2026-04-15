/**
 * Date utility functions that work with dates only (no time component)
 * All dates are normalized to midnight UTC to avoid timezone issues
 */

/**
 * Convert a Date or date string to a date-only key (YYYY-MM-DD)
 * This ensures consistent date comparison regardless of time/timezone
 */
export function toDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // Use UTC components to avoid timezone shifts
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
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