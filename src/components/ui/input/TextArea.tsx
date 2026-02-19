"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { useLocale } from "next-intl";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      variant = "default",
      resize = "vertical",
      className = "",
      disabled,
      required,
      dir,
      rows = 3,
      ...props
    },
    ref,
  ) => {
    const locale = useLocale();
    const isRTL = locale === "ar";

    // Variant classes
    const variantClasses = {
      default: "bg-white border border-gray-200",
      filled: "bg-gray-50 border border-transparent",
      outlined: "bg-transparent border-2 border-gray-300",
    };

    // Focus classes
    const focusClasses =
      variant === "outlined"
        ? "focus:border-primary"
        : "focus:ring-2 focus:ring-primary focus:border-transparent";

    // Error classes
    const errorClasses = error
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "";

    // Disabled classes
    const disabledClasses = disabled
      ? "bg-gray-100 cursor-not-allowed opacity-60"
      : "";

    // Resize classes
    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {/* Label */}
        {label && (
          <label
            className={`block text-sm font-medium text-gray-700 mb-1 ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* TextArea */}
        <textarea
          ref={ref}
          dir={dir || (isRTL ? "rtl" : "ltr")}
          disabled={disabled}
          required={required}
          rows={rows}
          className={`
            ${fullWidth ? "w-full" : ""}
            px-4 py-2.5 text-sm
            ${variantClasses[variant]}
            ${focusClasses}
            ${errorClasses}
            ${disabledClasses}
            ${resizeClasses[resize]}
            rounded-lg
            transition-colors
            placeholder:text-gray-400
            ${className}
          `}
          {...props}
        />

        {/* Helper Text or Error Message */}
        {(helperText || error) && (
          <div
            className={`flex items-start gap-1 mt-1 text-xs ${
              error ? "text-red-600" : "text-gray-500"
            } ${isRTL ? "text-right" : "text-left"}`}
          >
            {error && <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />}
            <span>{error || helperText}</span>
          </div>
        )}
      </div>
    );
  },
);

TextArea.displayName = "TextArea";

export default TextArea;
