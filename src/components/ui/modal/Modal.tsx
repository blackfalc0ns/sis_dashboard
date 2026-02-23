"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useLocale } from "next-intl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  className = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full mx-4",
  };

 // ... نفس imports ونفس props

return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={handleOverlayClick}
    dir={isRTL ? "rtl" : "ltr"}
  >
    <div
      ref={modalRef}
      className={`
        relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl
        transition-all ${className}
        max-h-[calc(100vh-200px)]
        flex flex-col overflow-hidden
      `}
      style={{ animation: "modalFadeIn 0.2s ease-out" }}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Modal"}
    >
      {/* Header (fixed داخل المودال) */}
      {(title || showCloseButton) && (
        <div className="shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
          {showCloseButton && (
            <button
              onClick={onClose}
              className={`p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
                !title ? "absolute top-4 " + (isRTL ? "left-4" : "right-4") : ""
              }`}
              aria-label="Close"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Content (اللي عليه السكرول فقط) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {children}
      </div>

      {/* Footer (fixed داخل المودال) */}
      {footer && (
        <div className="shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>

    <style jsx>{`
      @keyframes modalFadeIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `}</style>
  </div>
);
}
