"use client";

import { useState } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Envelope, LockKey, Shield } from "@phosphor-icons/react";
import Link from "next/link";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const verificationSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must be 6 digits"),
});

type SignInValues = z.infer<typeof signInSchema>;
type VerificationValues = z.infer<typeof verificationSchema>;

export function SignInForm() {
  const { signIn, errors: clerkErrors } = useSignIn();
  const { isLoaded } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  
  // Separate form for verification code
  const [code, setCode] = useState("");

  // Reset password states
  const [resetPasswordStep, setResetPasswordStep] = useState<'email' | 'code' | 'password' | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
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

      // Handle needs_client_trust or needs_second_factor (verification code required)
      if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
        console.log("Verification required");
        const { error: sendError } = await signIn.mfa.sendEmailCode();
        if (sendError) {
          setServerError(sendError.message || "Failed to send verification code.");
          return;
        }
        setVerificationEmail(values.email);
        setPendingVerification(true);
        startResendTimer();
        return;
      }

      // Handle other statuses
      console.error("Unhandled sign-in status:", signIn.status, signIn);
      setServerError(`Sign-in incomplete (${signIn.status}). Please try again.`);
    } catch (err: any) {
      console.error("Sign-in exception:", err);
      setServerError(err.errors?.[0]?.message || err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || code.length !== 6) return;
    
    setIsSubmitting(true);
    setServerError(null);

    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code });

      if (error) {
        setServerError(error.message || "Invalid verification code. Please try again.");
        setIsSubmitting(false);
        return;
      }

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

      setServerError("Verification incomplete. Please try again.");
    } catch (err: any) {
      setServerError(err.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signIn || resendTimer > 0) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setServerError(error.message || "Failed to resend code.");
      } else {
        startResendTimer();
      }
    } catch (err: any) {
      setServerError(err.errors?.[0]?.message || "Failed to resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Reset Password Flow ---

  const handleResetEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || !resetEmail.trim()) return;
    
    setIsSubmitting(true);
    setServerError(null);

    try {
      const { error: createError } = await signIn.create({
        identifier: resetEmail,
      });

      if (createError) {
        setServerError(createError.longMessage || createError.message || "Invalid email address.");
        return;
      }

      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setServerError(sendError.longMessage || sendError.message || "Failed to send reset code.");
        return;
      }

      setResetPasswordStep('code');
    } catch (err: any) {
      setServerError(err.errors?.[0]?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || resetCode.length !== 6) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({
        code: resetCode,
      });

      if (error) {
        setServerError(error.longMessage || error.message || "Invalid verification code.");
        return;
      }

      setResetPasswordStep('password');
    } catch (err: any) {
      setServerError(err.errors?.[0]?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || resetPassword.length < 8) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password: resetPassword,
      });

      if (error) {
        setServerError(error.longMessage || error.message || "Failed to update password.");
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: (url) => {
            const urlString = typeof url === "string" ? url : "/dashboard";
            router.push(urlString);
            return Promise.resolve();
          },
        });
        return;
      }

      setServerError("Password reset incomplete. Please try again.");
    } catch (err: any) {
      setServerError(err.errors?.[0]?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };
  // ---------------------------

  // Show verification UI
  if (pendingVerification) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Verify your identity</h3>
          <p className="text-sm text-text-secondary">
            We've sent a verification code to <span className="font-medium text-text-primary">{verificationEmail}</span>
          </p>
        </div>

        <form onSubmit={handleVerificationSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full h-12 px-4 text-center text-2xl tracking-[0.5em] rounded-[--radius-sm] border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              autoComplete="one-time-code"
            />
          </div>

          {serverError && (
            <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-md animate-slide-up">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting} disabled={code.length !== 6 || isSubmitting}>
            Verify & Sign In
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-text-secondary">
            Didn't receive the code?{" "}
            {resendTimer > 0 ? (
              <span className="text-text-tertiary">Resend in {resendTimer}s</span>
            ) : (
              <button
                onClick={handleResendCode}
                disabled={isSubmitting}
                className="text-primary font-medium hover:underline disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Resend code"}
              </button>
            )}
          </p>
          <p className="text-sm text-text-secondary">
            <button
              onClick={() => { setPendingVerification(false); setCode(""); setServerError(null); }}
              className="text-primary font-medium hover:underline"
            >
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Show Reset Password UI
  if (resetPasswordStep) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <LockKey className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            {resetPasswordStep === 'email' && "Reset Password"}
            {resetPasswordStep === 'code' && "Verify Email"}
            {resetPasswordStep === 'password' && "Create New Password"}
          </h3>
          <p className="text-sm text-text-secondary">
            {resetPasswordStep === 'email' && "Enter your email to receive a reset code."}
            {resetPasswordStep === 'code' && `We've sent a code to ${resetEmail}`}
            {resetPasswordStep === 'password' && "Please enter your new secure password."}
          </p>
        </div>

        {resetPasswordStep === 'email' && (
          <form onSubmit={handleResetEmailSubmit} className="space-y-4">
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="name@example.com" 
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              leftIcon={<Envelope className="w-4 h-4 text-text-tertiary" />}
            />
            {serverError && (
              <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-md animate-slide-up">
                {serverError}
              </div>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting} disabled={!resetEmail.includes("@") || isSubmitting}>
              Send Reset Code
            </Button>
          </form>
        )}

        {resetPasswordStep === 'code' && (
          <form onSubmit={handleResetCodeSubmit} className="space-y-4">
            <Input 
              label="Verification Code" 
              type="text" 
              placeholder="000000" 
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
              className="text-center tracking-widest"
            />
            {serverError && (
              <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-md animate-slide-up">
                {serverError}
              </div>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting} disabled={resetCode.length !== 6 || isSubmitting}>
              Verify Code
            </Button>
          </form>
        )}

        {resetPasswordStep === 'password' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <Input 
              label="New Password" 
              type="password" 
              placeholder="••••••••" 
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              leftIcon={<LockKey className="w-4 h-4 text-text-tertiary" />}
            />
            {serverError && (
              <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-md animate-slide-up">
                {serverError}
              </div>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting} disabled={resetPassword.length < 8 || isSubmitting}>
              Update Password
            </Button>
          </form>
        )}

        <div className="text-center">
          <button
            onClick={() => { setResetPasswordStep(null); setServerError(null); }}
            className="text-primary font-medium hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // Normal sign-in form
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
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              {...register("password")}
              error={errors.password?.message}
              leftIcon={<LockKey className="w-4 h-4 text-text-tertiary" />}
            />
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={() => setResetPasswordStep('email')}
              className="text-xs text-primary font-medium hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>
        
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
        Don't have an account?{" "}
        <Link href="/sign-up" className="text-primary font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
