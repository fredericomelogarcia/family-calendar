import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default async function SignUpPage() {
  // Redirect to dashboard if already signed in
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={
      <AuthLayout 
        title="Create Account" 
        subtitle="Join Zawly and keep your family organized"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </AuthLayout>
    }>
      <AuthLayout 
        title="Create Account" 
        subtitle="Join Zawly and keep your family organized"
      >
        <SignUpForm />
      </AuthLayout>
    </Suspense>
  );
}
