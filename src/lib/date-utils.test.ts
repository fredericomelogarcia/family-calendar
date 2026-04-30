import { toDateKey, toDateOnly, getDayOfWeek, isSameDate } from '@/lib/date-utils';
import { describe, it, expect } from 'vitest';

describe('date-utils', () => {
  describe('toDateKey', () => {
    it('converts a Date to YYYY-MM-DD format using local time', () => {
      const date = new Date(2026, 3, 15);
      expect(toDateKey(date)).toBe('2026-04-15');
    });

    it('handles ISO date strings', () => {
      expect(toDateKey('2026-04-15T00:00:00Z')).toBe('2026-04-15');
    });

    it('handles YYYY-MM-DD date strings', () => {
      expect(toDateKey('2026-04-15')).toBe('2026-04-15');
    });

    it('preserves day correctly', () => {
      const date = new Date(2026, 0, 31);
      expect(toDateKey(date)).toBe('2026-01-31');
    });
  });

  describe('toDateOnly', () => {
    it('creates a date-only Date from Date input', () => {
      const input = new Date(2026, 5, 20, 14, 30, 45);
      const result = toDateOnly(input);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(20);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('creates a date-only Date from string input', () => {
      const result = toDateOnly('2026-04-15');
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(15);
    });

    it('produces consistent keys for same dates', () => {
      const d1 = new Date(2026, 3, 15);
      const d2 = new Date(2026, 3, 15, 23, 59, 59);
      expect(toDateKey(toDateOnly(d1))).toBe(toDateKey(toDateOnly(d2)));
    });
  });

  describe('getDayOfWeek', () => {
    it('returns correct day for known dates', () => {
      expect(getDayOfWeek('2026-01-01')).toBe(4);
      expect(getDayOfWeek('2026-01-05')).toBe(1);
    });

    it('works with Date objects', () => {
      const sunday = new Date(2026, 0, 4);
      expect(getDayOfWeek(sunday)).toBe(0);
    });
  });

  describe('isSameDate', () => {
    it('returns true for same calendar day', () => {
      const a = new Date(2026, 3, 15, 8, 0, 0);
      const b = new Date(2026, 3, 15, 18, 30, 0);
      expect(isSameDate(a, b)).toBe(true);
    });

    it('returns false for different days', () => {
      const a = new Date(2026, 3, 15);
      const b = new Date(2026, 3, 16);
      expect(isSameDate(a, b)).toBe(false);
    });

    it('works with mixed Date and string inputs', () => {
      const a = new Date(2026, 3, 15);
      expect(isSameDate(a, '2026-04-15')).toBe(true);
    });
  });
});
