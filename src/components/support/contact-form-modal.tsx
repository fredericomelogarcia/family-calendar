"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EnvelopeSimple, CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react";

const contactSchema = z.object({
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be under 200 characters"),
  body: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be under 5000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactFormModal({ isOpen, onClose }: ContactFormModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: "",
      body: "",
    },
  });

  const handleClose = () => {
    onClose();
    // Delay reset so modal close animation plays first
    setTimeout(() => {
      reset();
      setSubmitted(false);
      setServerError(null);
    }, 300);
  };

  const onSubmit = async (data: ContactFormData) => {
    setServerError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Something went wrong");
      }

      setSubmitted(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to send message"
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={submitted ? undefined : "Contact Us"}
      showCloseButton={true}
    >
      {submitted ? (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle size={32} weight="fill" className="text-success" />
          </div>
          <h3 className="text-xl font-bold text-text-primary font-[family-name:var(--font-heading)]">
            Thank you!
          </h3>
          <p className="text-text-secondary text-sm max-w-xs">
            Your message has been sent successfully. We&apos;ll get back to you as soon as we can.
          </p>
          <Button variant="secondary" onClick={handleClose} className="mt-2">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <p className="text-text-secondary text-sm">
            We&apos;re always open to feedback, feature requests, or bug reports. 
            Just drop us a message and we&apos;ll get back to you!
          </p>

          <Input
            label="Subject"
            placeholder="e.g. Bug in calendar view"
            error={errors.subject?.message}
            {...register("subject")}
          />

          <Textarea
            label="Message"
            placeholder="Tell us what's on your mind..."
            rows={5}
            error={errors.body?.message}
            {...register("body")}
          />

          {serverError && (
            <p className="text-sm text-error animate-slide-up">{serverError}</p>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              loading={isSubmitting}
              leftIcon={<PaperPlaneTilt size={16} />}
            >
              Send Message
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}