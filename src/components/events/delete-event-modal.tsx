"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Trash, CalendarX, CalendarSlash } from "@phosphor-icons/react";

interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteAll: boolean) => void;
  isRecurring: boolean;
  eventTitle: string;
  loading?: boolean;
}

export function DeleteEventModal({
  isOpen,
  onClose,
  onConfirm,
  isRecurring,
  eventTitle,
  loading = false,
}: DeleteEventModalProps) {
  if (!isRecurring) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Delete Event" size="sm">
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <span className="font-semibold text-text-primary">"{eventTitle}"</span>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => onConfirm(false)}
              loading={loading}
              leftIcon={<Trash size={16} />}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Recurring Event" size="sm">
      <div className="space-y-4">
        <p className="text-text-secondary">
          <span className="font-semibold text-text-primary">"{eventTitle}"</span> is a recurring event. What would you like to delete?
        </p>
        <div className="space-y-2">
          <button
            onClick={() => onConfirm(false)}
            disabled={loading}
            className="w-full flex items-start gap-3 p-4 rounded-[--radius-md] border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
          >
            <CalendarX size={20} className="text-text-secondary group-hover:text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-text-primary">Delete this event only</p>
              <p className="text-xs text-text-tertiary mt-0.5">This occurrence will be removed. Future events stay on the calendar.</p>
            </div>
          </button>
          <button
            onClick={() => onConfirm(true)}
            disabled={loading}
            className="w-full flex items-start gap-3 p-4 rounded-[--radius-md] border border-border hover:border-error/40 hover:bg-error/5 transition-all text-left group disabled:opacity-50"
          >
            <CalendarSlash size={20} className="text-text-secondary group-hover:text-error mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-text-primary">Delete this and future events</p>
              <p className="text-xs text-text-tertiary mt-0.5">This and all following occurrences will be removed.</p>
            </div>
          </button>
        </div>
        <Button variant="secondary" onClick={onClose} className="w-full">
          Cancel
        </Button>
      </div>
    </Modal>
  );
}