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
  const { signIn } = useSignIn();
  const { isLoaded, isSignedIn } = useAuth();
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

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  const onSubmit = async (values: SignInValues) => {
    if (!signIn) return;
    setServerError(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn.create({
        identifier: values.email,
        password: values.password,
      });

      if (error) {
        setServerError(error.message || error.longMessage || "Something went wrong. Please try again.");
        return;
      }

      // If we get here, sign-in was initiated. Check the status.
      // The signal will update reactively, so we check signIn.status.
      if (signIn.status === "complete") {
        await signIn.finalize();
        router.push("/dashboard");
        return;
      }

      // If status isn't complete yet but no error, the session
      // may have been created (e.g. email verification pending).
      // Just redirect — Clerk middleware will handle auth.
      router.push("/dashboard");
    } catch (err: any) {
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