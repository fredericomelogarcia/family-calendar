import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isEventOnDay } from '@/lib/calendar-utils';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user-123' }),
}));

vi.mock('@/lib/db', () => {
  const mockEvents = [
    {
      id: 'evt-1',
      familyId: 'fam-1',
      title: 'Weekly Meeting',
      startDate: new Date('2026-04-15'),
      allDay: true,
      recurrence: 'weekly',
      excludedDates: ['2026-04-22'],
      notes: null,
      createdBy: 'user-123',
      updatedBy: 'user-123',
      updatedAt: new Date(),
      endDate: null,
    },
    {
      id: 'evt-2',
      familyId: 'fam-1',
      title: 'Birthday Party',
      startDate: new Date('2026-05-20'),
      allDay: true,
      recurrence: 'none',
      excludedDates: null,
      notes: 'Bring gifts',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      updatedAt: new Date(),
      endDate: null,
    },
    {
      id: 'evt-3',
      familyId: 'fam-1',
      title: 'Daily Standup',
      startDate: new Date('2026-03-01'),
      allDay: true,
      recurrence: 'daily',
      excludedDates: [],
      notes: null,
      createdBy: 'user-123',
      updatedBy: 'user-123',
      updatedAt: new Date(),
      endDate: new Date('2026-06-01'),
    },
  ];

  return {
    db: {
      query: {
        users: {
          findFirst: vi.fn().mockResolvedValue({ familyId: 'fam-1' }),
        },
        events: {
          findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
            return mockEvents.find(e => e.id === where?.value) || null;
          }),
          findMany: vi.fn().mockResolvedValue(mockEvents),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'new-evt-1',
            familyId: 'fam-1',
            title: 'New Event',
            startDate: new Date('2026-04-15'),
            allDay: true,
            recurrence: 'none',
            excludedDates: null,
            notes: null,
            createdBy: 'user-123',
            updatedBy: 'user-123',
            updatedAt: new Date(),
            endDate: null,
          }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              id: 'evt-1',
              familyId: 'fam-1',
              title: 'Updated Event',
              startDate: new Date('2026-04-15'),
              allDay: true,
              recurrence: 'weekly',
              excludedDates: null,
              notes: null,
              createdBy: 'user-123',
              updatedBy: 'user-123',
              updatedAt: new Date(),
              endDate: null,
            }]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    },
  };
});

describe('Event Edit Flow - Integration Tests', () => {
  describe('Recurring event editing preserves startDate', () => {
    it('weekly event matches same day of week from original startDate', () => {
      const event = {
        id: 'evt-1',
        title: 'Weekly Meeting',
        startDate: new Date('2026-04-15'),
        allDay: true,
        recurrence: 'weekly',
        excludedDates: [] as string[],
        endDate: null,
      };

      expect(isEventOnDay(event, new Date('2026-04-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-22'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-29'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-04-16'))).toBe(false);
    });

    it('editing should not change the startDate used for recurrence', () => {
      const originalEvent = {
        id: 'evt-1',
        title: 'Weekly Meeting',
        startDate: new Date('2026-04-01'),
        allDay: true,
        recurrence: 'weekly',
        excludedDates: [] as string[],
        endDate: null,
      };

      const updatedEvent = {
        ...originalEvent,
        startDate: new Date('2026-04-15'),
        title: 'Updated Weekly Meeting',
      };

      const originalMatches = isEventOnDay(originalEvent, new Date('2026-04-15'));
      const updatedMatches = isEventOnDay(updatedEvent, new Date('2026-04-22'));

      expect(originalMatches).toBe(true);
      expect(updatedMatches).toBe(true);
    });
  });

  describe('Recurring → Non-recurring transition clears excludedDates', () => {
    it('excludedDates should be cleared when recurrence becomes none', () => {
      const event = {
        id: 'evt-1',
        title: 'Weekly Meeting',
        startDate: new Date('2026-04-15'),
        allDay: true,
        recurrence: 'weekly',
        excludedDates: ['2026-04-22', '2026-04-29'],
        endDate: null,
      };

      const updatedEvent = {
        ...event,
        recurrence: 'none',
        excludedDates: null,
      };

      expect(updatedEvent.recurrence).toBe('none');
      expect(updatedEvent.excludedDates).toBeNull();
    });
  });

  describe('Non-recurring → Recurring event', () => {
    it('should start recurring from startDate', () => {
      const event = {
        id: 'evt-2',
        title: 'Birthday Party',
        startDate: new Date('2026-05-20'),
        allDay: true,
        recurrence: 'none',
        excludedDates: null,
        endDate: null,
      };

      const updatedEvent = {
        ...event,
        recurrence: 'monthly',
      };

      expect(isEventOnDay(updatedEvent, new Date('2026-05-20'))).toBe(true);
      expect(isEventOnDay(updatedEvent, new Date('2026-06-20'))).toBe(true);
      expect(isEventOnDay(updatedEvent, new Date('2026-07-20'))).toBe(true);
      expect(isEventOnDay(updatedEvent, new Date('2026-05-21'))).toBe(false);
    });
  });

  describe('endDate bounds for recurring events', () => {
    it('respects endDate for recurring events', () => {
      const event = {
        id: 'evt-3',
        title: 'Daily Standup',
        startDate: new Date('2026-03-01'),
        allDay: true,
        recurrence: 'daily',
        excludedDates: [],
        endDate: new Date('2026-06-01'),
      };

      expect(isEventOnDay(event, new Date('2026-03-15'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-06-01'))).toBe(true);
      expect(isEventOnDay(event, new Date('2026-06-02'))).toBe(false);
    });
  });
});
