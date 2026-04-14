"use client";

import { useSearchParams } from "next/navigation";
import { Envelope } from "@phosphor-icons/react";

export function VerificationBanner() {
  const searchParams = useSearchParams();
  const verifyEmail = searchParams.get("verify_email");
  const verified = searchParams.get("verified");

  if (verified === "true") {
    return (
      <div className="p-4 bg-success/10 border border-success/20 rounded-lg flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-success text-sm">Email verified!</h3>
          <p className="text-sm text-success/80 mt-0.5">
            Your email has been verified. You can now sign in to your account.
          </p>
        </div>
      </div>
    );
  }

  if (verifyEmail === "true") {
    return (
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
          <Envelope className="w-3 h-3 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-primary text-sm">Check your email</h3>
          <p className="text-sm text-text-secondary mt-0.5">
            We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
