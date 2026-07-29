"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";
import { AlertCircle } from "lucide-react";
import { useLocale } from "next-intl";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  inputSize?: "sm" | "md" | "lg";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      variant = "default",
      inputSize = "md",
      className = "",
      disabled,
      required,
      dir,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const locale = useLocale();
    const isRTL = locale === "ar";
    const generatedId = useId();
    const inputId = id || generatedId;
    const descriptionId = `${inputId}-description`;
    const describedBy = [
      ariaDescribedBy,
      helperText || error ? descriptionId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    // Size classes
    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-4 py-3 text-base",
    };

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
        : "focus:ring-2 focus:ring-primary focus:border-transparent outline-none";

    // Error classes
    const errorClasses = error
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "";

    // Disabled classes
    const disabledClasses = disabled
      ? "bg-gray-100 cursor-not-allowed opacity-60"
      : "";

    // Icon padding
    const iconPaddingLeft = leftIcon ? (isRTL ? "pr-10" : "pl-10") : "";
    const iconPaddingRight = rightIcon || error ? (isRTL ? "pl-10" : "pr-10") : "";

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium text-gray-700 mb-1 ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                isRTL ? "right-3" : "left-3"
              } text-gray-400`}
            >
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            dir={dir || (isRTL ? "rtl" : "ltr")}
            disabled={disabled}
            required={required}
            aria-describedby={describedBy}
            aria-invalid={ariaInvalid ?? Boolean(error)}
            className={`
              ${fullWidth ? "w-full" : ""}
              ${sizeClasses[inputSize]}
              ${variantClasses[variant]}
              ${focusClasses}
              ${errorClasses}
              ${disabledClasses}
              ${iconPaddingLeft}
              ${iconPaddingRight}
              rounded-lg
              transition-colors
              placeholder:text-gray-400
              ${className}
            `}
            {...props}
          />

          {/* Right Icon or Error Icon */}
          {(rightIcon || error) && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                isRTL ? "left-3" : "right-3"
              } ${error ? "text-red-500 pointer-events-none" : "text-gray-400"}`}
            >
              {error ? <AlertCircle className="w-5 h-5" /> : rightIcon}
            </div>
          )}
        </div>

        {/* Helper Text or Error Message */}
        {(helperText || error) && (
          <div
            id={descriptionId}
            role={error ? "alert" : undefined}
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

Input.displayName = "Input";

export default Input;
