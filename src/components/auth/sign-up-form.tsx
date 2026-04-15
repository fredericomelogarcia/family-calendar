"use client";

import { useState, useEffect } from "react";
import { useAuth, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Envelope, LockKey } from "@phosphor-icons/react";
import Link from "next/link";

const signUpSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  acceptTerms: z.boolean().refine((val) => val === true, "You must accept the Terms & Conditions"),
});

const verificationCodeSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits").regex(/^\d{6}$/, "Code must be 6 digits"),
});

type SignUpValues = z.infer<typeof signUpSchema>;
type VerificationValues = z.infer<typeof verificationCodeSchema>;

export function SignUpForm() {
  const { signUp, errors: clerkErrors } = useSignUp();
  const { isLoaded } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      acceptTerms: false,
    },
  });

  const {
    register: registerVerification,
    handleSubmit: handleVerificationSubmit,
    formState: { errors: verificationErrors },
  } = useForm<VerificationValues>({
    resolver: zodResolver(verificationCodeSchema),
    mode: "onChange",
  });

  const acceptTerms = watch("acceptTerms");

  // Countdown timer for resending code
  useEffect(() => {
    if (!pendingVerification || resendTimer <= 0) return;
    
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingVerification, resendTimer]);

  const onSubmit = async (values: SignUpValues) => {
    if (!isLoaded || !signUp) return;
    setServerError(null);
    setIsSubmitting(true);

    try {
      // Create the sign-up with password
      const { error } = await signUp.password({
        emailAddress: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });

      if (error) {
        setServerError(error.message || "An error occurred during sign up");
        setIsSubmitting(false);
        return;
      }

      // Check status after password sign-up
      if (signUp.status === "complete") {
        // Sign-up complete, finalize and redirect
        await signUp.finalize({
          navigate: (url) => {
            const urlString = typeof url === "string" ? url : "/dashboard";
            router.push(urlString);
            return Promise.resolve();
          },
        });
        return;
      }

      if (signUp.status === "missing_requirements") {
        // Check if email verification is needed
        if (signUp.unverifiedFields.includes("email_address")) {
          // Send verification code
          await signUp.verifications.sendEmailCode();
          
          setVerificationEmail(values.email);
          setPendingVerification(true);
        }
      }
    } catch (err: any) {
      setServerError(err.errors?.[0]?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerificationSubmit = async (values: VerificationValues) => {
    if (!isLoaded || !signUp) return;
    setServerError(null);
    setIsSubmitting(true);

    try {
      // Attempt to verify the email code
      const { error } = await signUp.verifications.verifyEmailCode({
        code: values.code,
      });

      if (error) {
        setServerError(error.message || "Invalid verification code. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (signUp.status === "complete") {
        // Verification successful, finalize sign-up
        await signUp.finalize({
          navigate: (url) => {
            const urlString = typeof url === "string" ? url : "/dashboard";
            router.push(urlString);
            return Promise.resolve();
          },
        });
        return;
      }

      // If not complete, something is still missing
      setServerError("Verification incomplete. Please try again.");
    } catch (err: any) {
      setServerError(err.errors?.[0]?.message || "Invalid verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;
    setIsResending(true);
    setServerError(null);

    try {
      await signUp.verifications.sendEmailCode();
      setResendTimer(60);
    } catch (err: any) {
      setServerError(err.errors?.[0]?.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Show verification UI
  if (pendingVerification) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Envelope className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Verify your email</h3>
          <p className="text-sm text-text-secondary">
            We&apos;ve sent a verification code to <span className="font-medium text-text-primary">{verificationEmail}</span>
          </p>
        </div>

        <form onSubmit={handleVerificationSubmit(onVerificationSubmit)} className="space-y-4">
          <Input
            label="Verification Code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            {...registerVerification("code")}
            error={verificationErrors.code?.message}
            className="text-center tracking-widest text-lg"
            autoComplete="one-time-code"
          />

          {serverError && (
            <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-md animate-slide-up">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
            Verify Email
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-text-secondary">
            Didn&apos;t receive the code?{" "}
            {resendTimer > 0 ? (
              <span className="text-text-tertiary">Resend in {resendTimer}s</span>
            ) : (
              <button
                onClick={handleResendCode}
                disabled={isResending}
                className="text-primary font-medium hover:underline disabled:opacity-50"
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            )}
          </p>
          <p className="text-sm text-text-secondary">
            <Link href="/sign-in" className="text-primary font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Show sign-up form
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="First Name" 
            type="text" 
            placeholder="John" 
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <Input 
            label="Last Name" 
            type="text" 
            placeholder="Doe" 
            {...register("lastName")}
            error={errors.lastName?.message}
          />
        </div>
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
        
        <Controller
          name="acceptTerms"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="accept-terms"
              checked={field.value}
              onChange={(checked) => field.onChange(checked)}
              error={errors.acceptTerms?.message}
              label={
                <>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-primary font-semibold hover:underline"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary font-semibold hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </>
              }
            />
          )}
        />

        {serverError && (
          <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-md animate-slide-up">
            {serverError}
          </div>
        )}

        {/* Clerk CAPTCHA container - only takes space when rendered */}
        <div id="clerk-captcha" className="flex justify-center empty:hidden" />

        <Button type="submit" className="w-full" loading={isSubmitting} disabled={!isValid || isSubmitting}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
