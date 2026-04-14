import { AuthLayout } from "@/components/layout/auth-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join Zawly Calendar and keep your family organized"
    >
      <SignUpForm />
    </AuthLayout>
  );
}