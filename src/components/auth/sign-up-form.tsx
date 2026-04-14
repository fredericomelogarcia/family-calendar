"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
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

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const { signUp } = useSignUp();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      acceptTerms: false,
    },
  });

  const onSubmit = async (values: SignUpValues) => {
    setServerError(null);
    try {
      await signUp.create({
        emailAddress: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });

      router.push("/sign-in?verify_email=true");
    } catch (err: any) {
      setServerError(err.errors?.[0]?.message || "An unexpected error occurred");
    }
  };

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
              onChange={field.onChange}
              error={errors.acceptTerms?.message}
              label={
                <>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-primary font-semibold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-primary font-semibold hover:underline"
                    onClick={(e) => e.stopPropagation()}
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

        <Button type="submit" className="w-full" loading={false} disabled={!isValid}>
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