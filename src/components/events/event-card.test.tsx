import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from '@/components/events/event-card';
import { describe, it, expect } from 'vitest';

describe('EventCard', () => {
  const baseEvent = {
    id: 'test-1',
    title: 'Team Meeting',
    startDate: new Date('2026-04-15'),
    allDay: true,
  };

  describe('display', () => {
    it('renders the event title', () => {
      render(<EventCard event={baseEvent} />);
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('shows "All day" when allDay is true', () => {
      render(<EventCard event={baseEvent} />);
      expect(screen.getByText('All day')).toBeInTheDocument();
    });

    it('shows start time when allDay is false', () => {
      render(<EventCard event={{ ...baseEvent, allDay: false, startDate: new Date('2026-04-15T09:00:00') }} />);
      expect(screen.getByText(/9:00/)).toBeInTheDocument();
    });

    it('does not show date when showDate is false', () => {
      render(<EventCard event={baseEvent} showDate={false} />);
      expect(screen.queryByText(/Wednesday/)).not.toBeInTheDocument();
    });

    it('shows date when showDate is true', () => {
      render(<EventCard event={baseEvent} showDate />);
      expect(screen.getByText(/Wednesday, April 15/)).toBeInTheDocument();
    });

    it('uses occurrenceDate for display when provided', () => {
      render(
        <EventCard
          event={baseEvent}
          showDate
          occurrenceDate={new Date('2026-05-20')}
        />
      );
      expect(screen.getByText(/Wednesday, May 20/)).toBeInTheDocument();
    });

    it('defaults allDay to true when not specified', () => {
      render(<EventCard event={{ ...baseEvent, allDay: undefined }} />);
      expect(screen.getByText('All day')).toBeInTheDocument();
    });
  });

  describe('edit button', () => {
    it('renders edit button when onEdit is provided', () => {
      render(<EventCard event={baseEvent} onEdit={() => {}} />);
      expect(screen.getByRole('button', { name: 'Edit event' })).toBeInTheDocument();
    });

    it('does not render edit button when onEdit is not provided', () => {
      render(<EventCard event={baseEvent} />);
      expect(screen.queryByRole('button', { name: 'Edit event' })).not.toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', async () => {
      const onEdit = vi.fn();
      render(<EventCard event={baseEvent} onEdit={onEdit} />);
      const editButton = screen.getByRole('button', { name: 'Edit event' });
      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalled();
    });
  });
});
