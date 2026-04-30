"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactFormModal } from "@/components/support/contact-form-modal";
import { EnvelopeSimple } from "@phosphor-icons/react";

export function ContactFormButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <p className="text-sm text-text-secondary mb-3">
        Have feedback, a feature request, or found a bug? We'd love to hear from you!
      </p>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(true)}
        leftIcon={<EnvelopeSimple size={18} />}
      >
        Contact Us
      </Button>

      <ContactFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}