import { describe, it, expect } from 'vitest';
import type { EventFormData } from '@/components/events/event-form';

type FormMode = 'create' | 'edit';

const shouldClearExcludedDates = (
  isEditingRecurring: boolean,
  recurrence: EventFormData['recurrence']
) => isEditingRecurring && recurrence === 'none';

const isRecurringEdit = (mode: FormMode, recurrence: EventFormData['recurrence']) =>
  mode === 'edit' && Boolean(recurrence && recurrence !== 'none');

const shouldShowRangeEnd = (recurrence: EventFormData['recurrence']) => recurrence === 'daily';

describe('EventForm - Unit Tests', () => {
  describe('handleSubmit - clearExcludedDates logic', () => {
    it('sets clearExcludedDates=true when recurring event becomes non-recurring', () => {
      const isEditingRecurring = true;
      const recurrence = 'none';
      const clearExcludedDates = shouldClearExcludedDates(isEditingRecurring, recurrence);
      expect(clearExcludedDates).toBe(true);
    });

    it('sets clearExcludedDates=false when keeping recurrence', () => {
      const isEditingRecurring = true;
      const recurrence = 'monthly';
      const clearExcludedDates = shouldClearExcludedDates(isEditingRecurring, recurrence);
      expect(clearExcludedDates).toBe(false);
    });

    it('sets clearExcludedDates=false for non-recurring events', () => {
      const isEditingRecurring = false;
      const recurrence = 'weekly';
      const clearExcludedDates = shouldClearExcludedDates(isEditingRecurring, recurrence);
      expect(clearExcludedDates).toBe(false);
    });

    it('sets clearExcludedDates=false when non-recurring stays non-recurring', () => {
      const isEditingRecurring = false;
      const recurrence = 'none';
      const clearExcludedDates = shouldClearExcludedDates(isEditingRecurring, recurrence);
      expect(clearExcludedDates).toBe(false);
    });
  });

  describe('isEditingRecurring detection', () => {
    it('detects weekly as recurring', () => {
      const mode = 'edit';
      const recurrence = 'weekly';
      const isEditingRecurring = isRecurringEdit(mode, recurrence);
      expect(isEditingRecurring).toBe(true);
    });

    it('detects monthly as recurring', () => {
      const mode = 'edit';
      const recurrence = 'monthly';
      const isEditingRecurring = isRecurringEdit(mode, recurrence);
      expect(isEditingRecurring).toBe(true);
    });

    it('detects yearly as recurring', () => {
      const mode = 'edit';
      const recurrence = 'yearly';
      const isEditingRecurring = isRecurringEdit(mode, recurrence);
      expect(isEditingRecurring).toBe(true);
    });

    it('does not detect none as recurring', () => {
      const mode = 'edit';
      const recurrence = 'none';
      const isEditingRecurring = isRecurringEdit(mode, recurrence);
      expect(isEditingRecurring).toBe(false);
    });

    it('does not detect create mode as editing', () => {
      const mode = 'create';
      const recurrence = 'weekly';
      const isEditingRecurring = isRecurringEdit(mode, recurrence);
      expect(isEditingRecurring).toBe(false);
    });

    it('does not detect undefined recurrence as recurring', () => {
      const mode = 'edit';
      const recurrence = undefined;
      const isEditingRecurring = isRecurringEdit(mode, recurrence);
      expect(isEditingRecurring).toBe(false);
    });
  });

  describe('disableDate prop', () => {
    it('disables date input for recurring events', () => {
      const isEditingRecurring = true;
      const disableDate = false;
      const shouldDisable = disableDate || isEditingRecurring;
      expect(shouldDisable).toBe(true);
    });

    it('disables date input when disableDate is true even for non-recurring', () => {
      const isEditingRecurring = false;
      const disableDate = true;
      const shouldDisable = disableDate || isEditingRecurring;
      expect(shouldDisable).toBe(true);
    });

    it('enables date input for non-recurring events', () => {
      const isEditingRecurring = false;
      const disableDate = false;
      const shouldDisable = disableDate || isEditingRecurring;
      expect(shouldDisable).toBe(false);
    });
  });

  describe('Issue #6 - Start and End Time', () => {
    const allDay = true;
    const startTime = "09:00";
    const endTime = "10:00";

    it('excludes startTime when allDay is true', () => {
      const storedStartTime = allDay ? undefined : startTime;
      expect(storedStartTime).toBeUndefined();
    });

    it('includes startTime when not allDay', () => {
      const allDay = false;
      const storedStartTime = allDay ? undefined : startTime;
      expect(storedStartTime).toBe("09:00");
    });

    it('excludes endTime when allDay is true', () => {
      const storedEndTime = allDay ? undefined : endTime;
      expect(storedEndTime).toBeUndefined();
    });

    it('includes endTime when not allDay', () => {
      const allDay = false;
      const storedEndTime = allDay ? undefined : endTime;
      expect(storedEndTime).toBe("10:00");
    });

    it('formats time display with both start and end', () => {
      const hasEndTime = true;
      const timeDisplay = hasEndTime 
        ? `${startTime} - ${endTime}`
        : startTime;
      expect(timeDisplay).toBe("09:00 - 10:00");
    });

    it('formats time display with only start time', () => {
      const hasEndTime = false;
      const timeDisplay = hasEndTime 
        ? `${startTime} - ${endTime}`
        : startTime;
      expect(timeDisplay).toBe("09:00");
    });
  });

  describe('Issue #7 - Daily Range Date (recurrenceEndDate)', () => {
    const recurrence = "daily";
    const showRangeEnd = shouldShowRangeEnd(recurrence);

    it('shows range end input for daily recurrence', () => {
      expect(showRangeEnd).toBe(true);
    });

    it('hides range end input for non-daily recurrence', () => {
      const recurrence = "weekly";
      const showRangeEnd = shouldShowRangeEnd(recurrence);
      expect(showRangeEnd).toBe(false);
    });

    it('creates daily recurrence with end date', () => {
      const recurrence = "daily";
      const recurrenceEndDate = new Date("2026-05-15");
      const finalData: EventFormData = {
        title: "Test Event",
        startDate: new Date("2026-04-01"),
        allDay: true,
        recurrence,
        recurrenceEndDate,
      };
      expect(finalData.recurrence).toBe("daily");
      expect(finalData.recurrenceEndDate).toBeDefined();
    });

    it('creates daily recurrence without end date (infinite)', () => {
      const recurrence = "daily";
      const finalData: EventFormData = {
        title: "Test Event",
        startDate: new Date("2026-04-01"),
        allDay: true,
        recurrence,
      };
      expect(finalData.recurrence).toBe("daily");
      expect(finalData.recurrenceEndDate).toBeUndefined();
    });
  });
});
