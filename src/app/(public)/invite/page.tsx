"use client";

import { Suspense, useState, useEffect } from "react";
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
        setTimeout(() => {
          window.location.href = `/dashboard?t=${Date.now()}`;
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to accept invitation");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid invitation link. Please check your email and try again.");
      return;
    }

    if (!user) {
      setStatus("signin");
      return;
    }

    acceptInvitation();
  }, [user, isLoaded, token]);

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
          <h1 className="text-2xl font-bold text-text-primary mb-2">Join the Family</h1>
          <p className="text-text-secondary mb-6">Sign in to accept this invitation</p>
          <Button onClick={() => router.push("/sign-in")} leftIcon={<SignIn size={18} />} className="w-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (status === "accepting") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <Spinner size={40} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Accepting invitation...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} weight="fill" className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">You're In!</h1>
          <p className="text-text-secondary mb-2">Welcome to {familyName}</p>
          <p className="text-text-secondary">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} weight="fill" className="text-error-dark" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Oops!</h1>
          <p className="text-text-secondary mb-6">{errorMessage}</p>
          <Link href="/">
            <Button variant="secondary" leftIcon={<Users size={18} />}>
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
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