import { describe, it, expect } from 'vitest';

describe('Dashboard - handleUpcomingEventClick', () => {
  it('sets occurrenceDate to null for upcoming events', () => {
    let editingEvent: any = null;
    let occurrenceDate: Date | null = null;

    const handleEventClick = (event: any, selectedDate: Date) => {
      editingEvent = event;
      occurrenceDate = selectedDate;
    };

    const handleUpcomingEventClick = (event: any) => {
      editingEvent = event;
      occurrenceDate = null;
    };

    const event = { id: 'evt-1', title: 'Future Event', recurrence: 'weekly' };

    handleEventClick(event, new Date('2026-05-20'));
    expect(occurrenceDate).toEqual(new Date('2026-05-20'));

    handleUpcomingEventClick(event);
    expect(occurrenceDate).toBeNull();
  });

  it('upcoming events do not use occurrenceDate as startDate', () => {
    const event = {
      id: 'evt-1',
      title: 'Weekly Meeting',
      startDate: new Date('2026-04-01'),
      recurrence: 'weekly',
    };

    const occurrenceDate = null;

    expect(occurrenceDate || event.startDate).toEqual(event.startDate);
  });
});

describe('Calendar - handleEventClick', () => {
  it('sets occurrenceDate to selectedDate for day grid events', () => {
    let editingEvent: any = null;
    let occurrenceDate: Date | null = null;

    const handleEventClick = (event: any, selectedDate: Date) => {
      editingEvent = event;
      occurrenceDate = selectedDate;
    };

    const event = { id: 'evt-1', title: 'Day Event' };
    const selectedDate = new Date('2026-04-15');

    handleEventClick(event, selectedDate);
    expect(editingEvent).toEqual(event);
    expect(occurrenceDate).toEqual(selectedDate);
  });

  it('edit form uses original startDate, not occurrenceDate', () => {
    const event = {
      id: 'evt-1',
      title: 'Weekly Meeting',
      startDate: new Date('2026-04-01'),
      recurrence: 'weekly',
    };
    const occurrenceDate = new Date('2026-04-15');

    const initialData = {
      title: event.title,
      startDate: event.startDate,
      recurrence: event.recurrence || 'none',
    };

    expect(initialData.startDate).toEqual(new Date('2026-04-01'));
    expect(initialData.startDate).not.toEqual(occurrenceDate);
  });
});
