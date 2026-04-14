"use client";

import { Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { EventForm, EventFormData } from "@/components/events/event-form";
import { showToast } from "@/components/ui/toast";
import { useState, useEffect } from "react";

function NewEventContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hasFamily, setHasFamily] = useState<boolean | null>(null);

  // Get date from query params
  const dateParam = searchParams.get("date");
  const defaultDate = dateParam ? new Date(dateParam) : new Date();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    checkFamily();
  }, [user, isLoaded]);

  const checkFamily = async () => {
    try {
      const res = await fetch("/api/family");
      const data = await res.json();
      setHasFamily(data.hasFamily);
    } catch (error) {
      console.error("Error checking family:", error);
    }
  };

  const handleCreateEvent = async (data: EventFormData) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to create event");
      }

      showToast("success", "Event created successfully!");
      router.push("/calendar");
    } catch (error) {
      showToast("error", "Failed to create event. Please try again.");
    }
  };

  if (!isLoaded || hasFamily === null) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasFamily === false) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">
            No Family Found
          </h2>
          <p className="text-text-secondary mb-4">
            Please set up your family first.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary text-white rounded-[--radius-md] font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-6">
        New Event
      </h1>

      <EventForm
        isOpen={true}
        onClose={() => router.back()}
        onSave={handleCreateEvent}
        defaultDate={defaultDate}
        mode="create"
      />
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={
      <div className="min-h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <NewEventContent />
    </Suspense>
  );
}