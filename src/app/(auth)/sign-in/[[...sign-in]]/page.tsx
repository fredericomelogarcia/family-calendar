"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { SignInForm } from "@/components/auth/sign-in-form";
import { VerificationBanner } from "@/components/auth/verification-banner";

function SignInContent() {
  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to manage your family calendar"
    >
      <div className="space-y-6">
        <VerificationBanner />
        <SignInForm />
      </div>
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <AuthLayout 
        title="Welcome Back" 
        subtitle="Sign in to manage your family calendar"
      >
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </AuthLayout>
    }>
      <SignInContent />
    </Suspense>
  );
}
