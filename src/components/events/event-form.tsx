"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarBlank, Clock, Repeat } from "@phosphor-icons/react";

export interface EventFormData {
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  notes?: string;
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "yearly";
}

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventFormData) => Promise<void>;
  onDelete?: () => void;
  initialData?: Partial<EventFormData>;
  defaultDate?: Date;
  mode?: "create" | "edit";
}

export function EventForm({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  defaultDate = new Date(),
  mode = "create",
}: EventFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [startDate, setStartDate] = useState(initialData?.startDate || defaultDate);
  const [allDay, setAllDay] = useState(initialData?.allDay ?? true);
  const [startTime, setStartTime] = useState(initialData?.startTime || "09:00");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [recurrence, setRecurrence] = useState<EventFormData["recurrence"]>(initialData?.recurrence || "none");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && mode === "create") {
      setStartDate(defaultDate);
      setTitle("");
      setAllDay(true);
      setStartTime("09:00");
      setNotes("");
      setRecurrence("none");
      setErrors({});
    }
  }, [isOpen, defaultDate, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!title.trim() || title.length < 2) newErrors.title = "Title must be at least 2 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        startDate,
        allDay,
        startTime: allDay ? undefined : startTime,
        notes: notes.trim() || undefined,
        recurrence,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save event:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "New Event" : "Edit Event"}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header Inputs */}
        <div className="space-y-6">
          <Input
            label="Event Title"
            placeholder="What's happening?"
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors(prev => ({ ...prev, title: "" })); }}
            error={errors.title}
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <label className="block text-sm font-medium text-text-primary">Date</label>
              <div className="relative">
                <CalendarBlank className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                <input
                  type="date"
                  value={format(startDate, "yyyy-MM-dd")}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="w-full min-w-0 h-11 sm:h-12 pl-10 pr-3 rounded-[--radius-sm] border border-border bg-surface text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-text-primary">Time</label>
                <Button
                  type="button"
                  onClick={() => setAllDay(!allDay)}
                  variant={allDay ? "primary" : "secondary"}
                  size="sm"
                  className="h-7 text-xs"
                >
                  {allDay ? "All Day" : "Set Time"}
                </Button>
              </div>
              {!allDay ? (
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full min-w-0 h-11 sm:h-12 pl-10 pr-3 rounded-[--radius-sm] border border-border bg-surface text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ) : (
                <div className="h-11 sm:h-12 flex items-center px-3 text-sm text-text-tertiary bg-surface-alt rounded-[--radius-sm] border border-border border-dashed">
                  Event spans the whole day
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recurrence */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-text-primary flex items-center gap-2">
            <Repeat size={16} /> Recurrence
          </label>
          <div className="flex flex-wrap gap-2">
            {([
              { id: "none", label: "None" },
              { id: "daily", label: "Daily" },
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
              { id: "yearly", label: "Yearly" },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRecurrence(opt.id as any)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full border transition-all",
                  recurrence === opt.id ? "bg-primary text-white border-primary shadow-sm" : "bg-surface border-border text-text-secondary hover:bg-surface-alt"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a description..."
            className="min-h-[100px]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-border">
          {mode === "edit" && onDelete && (
            <Button type="button" variant="danger" onClick={onDelete} className="flex-1 h-12">
              Delete
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 h-12">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="flex-1 h-12 shadow-lg shadow-primary/20">
            {mode === "create" ? "Create Event" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}