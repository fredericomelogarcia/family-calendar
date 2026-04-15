import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AuthLayout } from "@/components/layout/auth-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default async function SignUpPage() {
  // Redirect to dashboard if already signed in
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join Zawly Calendar and keep your family organized"
    >
      <SignUpForm />
    </AuthLayout>
  );
}
