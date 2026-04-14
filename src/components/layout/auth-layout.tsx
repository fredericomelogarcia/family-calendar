"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}

export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
  return (
    <div className={cn("min-h-screen flex items-center justify-center p-6 bg-background grain-texture", className)}>
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 mb-4 relative">
            <Image 
              src="/icons/icon.svg" 
              alt="Famly Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight text-center">
            {title}
          </h1>
          <p className="text-text-secondary mt-2 text-center">
            {subtitle}
          </p>
        </div>
        
        <div className="bg-surface p-8 rounded-[--radius-lg] shadow-lg border border-border">
          {children}
        </div>
      </div>
    </div>
  );
}
