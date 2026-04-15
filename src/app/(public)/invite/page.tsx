"use client";

import { useState, useEffect, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  CalendarCheck, 
  CheckCircle, 
  XCircle, 
  Spinner,
  SignIn,
  Users
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function InviteContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "signin" | "accepting" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [familyName, setFamilyName] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid invitation link. Please check your email and try again.");
      return;
    }

    // If not signed in, show sign-in prompt
    if (!user) {
      setStatus("signin");
      return;
    }

    // User is signed in, proceed to accept invitation
    acceptInvitation();
  }, [user, isLoaded, token]);

  const acceptInvitation = async () => {
    if (!token) return;
    
    setStatus("accepting");
    
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setFamilyName(data.family?.name || "");
        // Wait longer to ensure DB is updated, then use hard redirect
        setTimeout(() => {
          // Use timestamp to bust any cache
          window.location.href = `/dashboard?t=${Date.now()}`;
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to accept invitation");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  if (!isLoaded || status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <Spinner size={40} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "signin") {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CalendarCheck size={40} className="text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            You&apos;ve Been Invited!
          </h1>
          <p className="text-text-secondary mb-8">
            Sign in or create an account to join the family calendar.
          </p>

          <div className="space-y-3">
            <Link 
              href={`/sign-in?redirect_url=${encodeURIComponent(`/invite?token=${token}`)}`}
              className="block w-full"
            >
              <Button className="w-full" leftIcon={<SignIn size={18} />}>
                Sign In
              </Button>
            </Link>
            <Link 
              href={`/sign-up?redirect_url=${encodeURIComponent(`/invite?token=${token}`)}`}
              className="block w-full"
            >
              <Button variant="secondary" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>

          <p className="text-xs text-text-tertiary mt-6">
            After signing in, you&apos;ll automatically join the family.
          </p>
        </div>
      </div>
    );
  }

  if (status === "accepting") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <Spinner size={40} className="animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Joining Family...
          </h2>
          <p className="text-text-secondary">
            Setting up your calendar access
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex-1 flex items-center justify-center py-20 p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-success" weight="fill" />
          </div>
          
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Welcome to {familyName || "the Family"}!
          </h1>
          <p className="text-text-secondary mb-6">
            You&apos;ve successfully joined the family calendar.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-text-tertiary mb-6">
            <Users size={18} />
            <span>You can now view and add family events</span>
          </div>

          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="flex-1 flex items-center justify-center py-20 p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-error-dark" weight="fill" />
        </div>
        
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Couldn&apos;t Join Family
        </h1>
        <p className="text-text-secondary mb-6">
          {errorMessage || "Something went wrong."}
        </p>

        <div className="space-y-3">
          {token && (
            <Button onClick={acceptInvitation} variant="secondary" className="w-full">
              Try Again
            </Button>
          )}
          <Link href="/dashboard" className="block">
            <Button className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <Spinner size={40} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
