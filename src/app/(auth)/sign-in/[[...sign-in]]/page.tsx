import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { SignInForm } from "@/components/auth/sign-in-form";
import { VerificationBanner } from "@/components/auth/verification-banner";

export default async function SignInPage() {
  // Redirect to dashboard if already signed in
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

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
      <AuthLayout 
        title="Welcome Back" 
        subtitle="Sign in to manage your family calendar"
      >
        <div className="space-y-6">
          <VerificationBanner />
          <SignInForm />
        </div>
      </AuthLayout>
    </Suspense>
  );
}
