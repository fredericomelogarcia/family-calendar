"use client";

import { useState, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Envelope, LockKey } from "@phosphor-icons/react";
import Link from "next/link";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const { signIn, errors: clerkErrors } = useSignIn();
  const { isLoaded } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onChange",
  });

  const onSubmit = async (values: SignInValues) => {
    if (!isLoaded || !signIn) return;
    setServerError(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn.password({
        identifier: values.email,
        password: values.password,
      });

      if (error) {
        console.error("Sign-in error:", error);
        setServerError(error.message || error.longMessage || "Something went wrong. Please try again.");
        return;
      }

      console.log("Sign-in status:", signIn.status);
      console.log("Sign-in object:", signIn);

      // If sign-in successful, finalize
      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: (url) => {
            const urlString = typeof url === "string" ? url : "/dashboard";
            router.push(urlString);
            return Promise.resolve();
          },
        });
        return;
      }

      // Handle needs_client_trust (CAPTCHA/verification required)
      if (signIn.status === "needs_client_trust") {
        console.log("Client trust required - checking for supported factors");
        // Check if email code is available
        const emailCodeFactor = signIn.supportedSecondFactors?.find(
          (factor) => factor.strategy === "email_code"
        );
        if (emailCodeFactor) {
          await signIn.mfa.sendEmailCode();
          setServerError("Please check your email for a verification code to continue signing in.");
          return;
        }
        setServerError("Additional verification required. Please try again.");
        return;
      }

      // Handle needs_second_factor (MFA)
      if (signIn.status === "needs_second_factor") {
        setServerError("Two-factor authentication required. Check your email for a code.");
        return;
      }

      // Handle needs_identifier
      if (signIn.status === "needs_identifier") {
        setServerError("Please enter your email address.");
        return;
      }

      // Handle needs_new_password
      if (signIn.status === "needs_new_password") {
        setServerError("Your password needs to be reset. Please contact support.");
        return;
      }

      // Fallback for any other status
      console.error("Unhandled sign-in status:", signIn.status, signIn);
      setServerError(`Sign-in incomplete (${signIn.status}). Please try again.`);
    } catch (err: any) {
      console.error("Sign-in exception:", err);
      setServerError(err.errors?.[0]?.message || err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input 
          label="Email Address" 
          type="email" 
          placeholder="name@example.com" 
          {...register("email")}
          error={errors.email?.message}
          leftIcon={<Envelope className="w-4 h-4 text-text-tertiary" />}
        />
        <Input 
          label="Password" 
          type="password" 
          placeholder="••••••••" 
          {...register("password")}
          error={errors.password?.message}
          leftIcon={<LockKey className="w-4 h-4 text-text-tertiary" />}
        />
        
        {serverError && (
          <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-md animate-slide-up">
            {serverError}
          </div>
        )}

        {/* Clerk CAPTCHA container - required if bot protection triggers */}
        <div id="clerk-captcha" className="flex justify-center empty:hidden" />

        <Button type="submit" className="w-full" loading={isSubmitting} disabled={!isValid || isSubmitting}>
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-primary font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
