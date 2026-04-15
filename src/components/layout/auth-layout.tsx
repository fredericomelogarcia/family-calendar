"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SiteFooter } from "@/components/layout/site-footer";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}

export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
  return (
    <div className={cn("min-h-full flex flex-col bg-background grain-texture", className)}>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 mb-4">
              <Image
                src="/icons/icon-192.png"
                alt="Zawly Logo"
                width={48}
                height={48}
                className="rounded-[--radius-md]"
                priority
                sizes="48px"
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
      </main>

      <SiteFooter />
    </div>
  );
}