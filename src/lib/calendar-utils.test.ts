import { isEventOnDay } from '@/lib/calendar-utils';
import { describe, it, expect } from 'vitest';

const makeEvent = (overrides: Record<string, any> = {}) => ({
  id: 'test-event',
  title: 'Test Event',
  startDate: new Date('2026-04-15'),
  allDay: true,
  recurrence: 'none',
  ...overrides,
});

describe('calendar-utils - isEventOnDay', () => {
  describe('non-recurring events', () => {
    it('matches on exact date', () => {
      const event = makeEvent({ startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(true);
    });

    it('does not match on different date', () => {
      const event = makeEvent({ startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-16'))).toBe(false);
    });

    it('does not match when day is before start', () => {
      const event = makeEvent({ startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-14'))).toBe(false);
    });
  });

  describe('daily recurrence', () => {
    it('matches every day after start', () => {
      const event = makeEvent({ recurrence: 'daily' });
      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-16'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-05-01'))).toBe(true);
    });

    it('does not match before start', () => {
      const event = makeEvent({ recurrence: 'daily' });
      expect(isEventOnDay(event, new Date('2026-04-14'))).toBe(false);
    });

    it('respects endDate', () => {
      const event = makeEvent({
        recurrence: 'daily',
        endDate: new Date('2026-04-20'),
      });
      expect(isEventOnDay(event, new Date('2026-04-20'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-21'))).toBe(false);
    });
  });

  describe('weekly recurrence', () => {
    it('matches same day of week', () => {
      const event = makeEvent({ recurrence: 'weekly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-22'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-29'))).toBe(true);
    });

    it('does not match different day of week', () => {
      const event = makeEvent({ recurrence: 'weekly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-16'))).toBe(false);
      expect(isEventOnDay(event, new Date('2026-04-14'))).toBe(false);
    });
  });

  describe('biweekly recurrence', () => {
    it('matches every 2 weeks', () => {
      const event = makeEvent({ recurrence: 'biweekly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-29'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-05-13'))).toBe(true);
    });

    it('does not match odd weeks', () => {
      const event = makeEvent({ recurrence: 'biweekly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-22'))).toBe(false);
    });
  });

  describe('triweekly recurrence', () => {
    it('matches every 3 weeks', () => {
      const event = makeEvent({ recurrence: 'triweekly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-05-06'))).toBe(true);
    });

    it('does not match non-multiples of 3', () => {
      const event = makeEvent({ recurrence: 'triweekly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-22'))).toBe(false);
      expect(isEventOnDay(event, new Date('2026-04-29'))).toBe(false);
    });
  });

  describe('quadweekly recurrence', () => {
    it('matches every 4 weeks', () => {
      const event = makeEvent({ recurrence: 'quadweekly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-05-13'))).toBe(true);
    });

    it('does not match non-multiples of 4', () => {
      const event = makeEvent({ recurrence: 'quadweekly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-22'))).toBe(false);
      expect(isEventOnDay(event, new Date('2026-04-29'))).toBe(false);
    });
  });

  describe('monthly recurrence', () => {
    it('matches same date of month', () => {
      const event = makeEvent({ recurrence: 'monthly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-05-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-06-15'))).toBe(true);
    });

    it('does not match different date of month', () => {
      const event = makeEvent({ recurrence: 'monthly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-05-16'))).toBe(false);
    });
  });

  describe('yearly recurrence', () => {
    it('matches same month and date', () => {
      const event = makeEvent({ recurrence: 'yearly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2027-04-15'))).toBe(true);
    });

    it('does not match different month', () => {
      const event = makeEvent({ recurrence: 'yearly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2027-05-15'))).toBe(false);
    });

    it('does not match different date', () => {
      const event = makeEvent({ recurrence: 'yearly', startDate: new Date('2026-04-15') });
      expect(isEventOnDay(event, new Date('2027-04-16'))).toBe(false);
    });
  });

  describe('excludedDates', () => {
    it('skips excluded dates for recurring events', () => {
      const event = makeEvent({
        recurrence: 'weekly',
        startDate: new Date('2026-04-15'),
        excludedDates: ['2026-04-22'],
      });
      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-22'))).toBe(false);
      expect(isEventOnDay(event, new Date('2026-04-29'))).toBe(true);
    });

    it('skips excluded dates for non-recurring events', () => {
      const event = makeEvent({
        startDate: new Date('2026-04-15'),
        excludedDates: ['2026-04-15'],
      });
      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(false);
    });

    it('daily event stops at recurrenceEndDate', () => {
      const event = makeEvent({
        startDate: new Date('2026-04-15'),
        recurrence: 'daily',
        recurrenceEndDate: new Date('2026-04-20'),
      });
      // Before end date
      expect(isEventOnDay(event, new Date('2026-04-18'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-20'))).toBe(true);
      // After end date
      expect(isEventOnDay(event, new Date('2026-04-21'))).toBe(false);
      expect(isEventOnDay(event, new Date('2026-04-25'))).toBe(false);
    });

    it('daily event continues without recurrenceEndDate', () => {
      const event = makeEvent({
        startDate: new Date('2026-04-15'),
        recurrence: 'daily',
      });
      expect(isEventOnDay(event, new Date('2026-04-20'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-25'))).toBe(true);
      expect(isEventOnDay(event, new Date('2027-01-01'))).toBe(true);
    });
  });
});
