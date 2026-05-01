"use client";

import { cn } from "@/lib/utils";
import { X } from "@phosphor-icons/react";
import { useEffect, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
  sm: "max-w-sm w-[95vw] sm:w-[90vw]",
  md: "max-w-md w-[95vw] sm:w-[90vw]",
  lg: "max-w-2xl w-[95vw] sm:w-[90vw]",
  xl: "max-w-3xl w-[95vw] sm:w-[90vw]",
  full: "max-w-full w-[98vw]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
  size = "md",
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const onCloseRef = useRef(onClose);
  const openCountRef = useRef(0);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen && !isVisible) {
      setIsVisible(true);
      setIsAnimatingOut(false);
      document.body.style.overflow = "hidden";
      openCountRef.current += 1;
    } else if (!isOpen && isVisible && !isAnimatingOut) {
      setIsAnimatingOut(true);
      openCountRef.current -= 1;
      // Only restore scroll if no other modals are open
      if (openCountRef.current <= 0) {
        document.body.style.overflow = "";
        openCountRef.current = 0;
      }
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimatingOut(false);
        onCloseRef.current();
      }, 150);
    } else if (isOpen && isAnimatingOut) {
      // Re-opening while animating out — cancel the close
      setIsAnimatingOut(false);
      openCountRef.current += 1;
      if (openCountRef.current > 0) {
        document.body.style.overflow = "hidden";
      }
    }
  }, [isOpen, isVisible, isAnimatingOut]);

  // Cleanup on unmount — always restore scroll
  useEffect(() => {
    return () => {
      if (isVisible && !isAnimatingOut) {
        openCountRef.current -= 1;
        if (openCountRef.current <= 0) {
          document.body.style.overflow = "";
          openCountRef.current = 0;
        }
      }
    };
  }, [isVisible, isAnimatingOut]);

  const handleClose = useCallback(() => {
    if (isVisible && !isAnimatingOut) {
      setIsAnimatingOut(true);
      openCountRef.current -= 1;
      if (openCountRef.current <= 0) {
        document.body.style.overflow = "";
        openCountRef.current = 0;
      }
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimatingOut(false);
        onCloseRef.current();
      }, 150);
    }
  }, [isVisible, isAnimatingOut]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isVisible) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  const overlayClass = cn(
    "fixed inset-0 z-[100] bg-text-primary/60 backdrop-blur-sm flex items-center justify-center p-4",
    isAnimatingOut ? "animate-fade-out" : "animate-fade-in"
  );

  const contentClass = cn(
    "bg-surface shadow-2xl rounded-[--radius-lg] border border-border flex flex-col",
    "w-full max-h-[90vh]",
    sizeClasses[size],
    isAnimatingOut ? "animate-scale-out" : "animate-scale-in",
    className
  );

  return createPortal(
    <div className={overlayClass} onClick={handleClose}>
      <div className={contentClass} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border flex-shrink-0">
          {title && (
            <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-heading)]">
              {title}
            </h2>
          )}
          {!title && <div />}
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-surface-alt"
            >
              <X size={20} weight="bold" />
            </button>
          )}
        </div>
        <div className="overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}