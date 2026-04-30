"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Info, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// Simple toast state management
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toasts]));
}

export function showToast(type: ToastType, message: string) {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
  toasts = [...toasts, { id, type, message }];
  notifyListeners();

  // Auto remove after 4 seconds
  setTimeout(() => {
    removeToast(id);
  }, 4000);
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  const icons = {
    success: <CheckCircle size={20} weight="fill" className="text-success" />,
    error: <XCircle size={20} weight="fill" className="text-error" />,
    info: <Info size={20} weight="fill" className="text-primary" />,
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-[100] space-y-2">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-3 bg-surface px-4 py-3 rounded-[--radius-md] shadow-md border border-border",
            "min-w-[280px] max-w-[400px]",
            "animate-[toast-in_200ms_ease-out_forwards]"
          )}
        >
          {icons[toast.type]}
          <span className="text-sm text-text-primary flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 -m-1 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      ))}
    </div>
  );
}
