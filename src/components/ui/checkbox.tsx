"use client";

import { cn } from "@/lib/utils";
import { Check } from "@phosphor-icons/react";
import { forwardRef } from "react";

interface CheckboxProps {
  id?: string;
  label?: React.ReactNode;
  error?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, checked, onChange, disabled }, ref) => {
    const inputId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className={cn(
            "flex items-start gap-3 cursor-pointer select-none",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={(e) => {
            // Prevent label click from double-toggling when clicking links inside the label
            if ((e.target as HTMLElement).closest("a")) {
              e.preventDefault();
            }
          }}
        >
          <div className="relative mt-0.5 shrink-0">
            <input
              ref={ref}
              type="checkbox"
              id={inputId}
              checked={checked}
              disabled={disabled}
              onChange={(e) => onChange?.(e.target.checked)}
              className="peer sr-only"
            />
            <div
              className={cn(
                "w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all duration-150",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
                checked
                  ? "bg-primary border-primary"
                  : "bg-surface border-border hover:border-text-tertiary",
                error && !checked && "border-error"
              )}
            >
              <Check
                weight="bold"
                className={cn(
                  "w-3 h-3 text-white transition-opacity",
                  checked ? "opacity-100" : "opacity-0"
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