"use client";

import { cn } from "@/lib/utils";
import { Check } from "@phosphor-icons/react";
import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="flex items-start gap-3 cursor-pointer select-none"
        >
          <div className="relative mt-0.5 shrink-0">
            <input
              ref={ref}
              type="checkbox"
              id={inputId}
              className="peer sr-only"
              {...props}
            />
            <div
              className={cn(
                "w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all duration-150",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
                props.checked || props.defaultChecked
                  ? "bg-primary border-primary"
                  : "bg-surface border-border hover:border-text-tertiary",
                error && "border-error",
                props.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Check
                weight="bold"
                className={cn(
                  "w-3 h-3 text-white transition-opacity",
                  props.checked || props.defaultChecked ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
          </div>
          {label && (
            <span className="text-sm text-text-secondary leading-snug">
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="text-xs font-medium text-error animate-slide-up ml-8">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";