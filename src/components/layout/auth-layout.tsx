"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}

export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-background grain-texture", className)}>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 mb-4">
              <img
                src="/icons/icon-192.png"
                alt="Zawly Logo"
                className="w-full h-full object-cover rounded-[--radius-md]"
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

      <footer className="shrink-0 border-t border-border bg-surface/80 backdrop-blur-sm">
        <div className="max-w-md mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} Zawly Calendar
          </p>
          <nav className="flex items-center gap-4">
            <Link 
              href="/terms" 
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Terms &amp; Conditions
            </Link>
            <Link 
              href="/privacy" 
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}