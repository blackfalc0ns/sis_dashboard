"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, ChevronDown, Search } from "lucide-react";
import { useLocale } from "next-intl";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  searchText?: string;
}

export interface SelectProps {
  id?: string;
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  selectSize?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noOptionsText?: string;
  noResultsText?: string;
  onOpen?: () => void;
  onEndReached?: () => void;
}

const MENU_GAP = 8;
const MENU_MAX_HEIGHT = 240;

export default function Select({
  id,
  label,
  error,
  helperText,
  options = [],
  placeholder = "Select an option",
  fullWidth = true,
  variant = "default",
  selectSize = "md",
  className = "",
  disabled = false,
  required = false,
  value,
  onChange,
  name,
  searchable = false,
  searchPlaceholder = "Search...",
  noOptionsText = "No options available",
  noResultsText = "No matching results",
  onOpen,
  onEndReached,
}: SelectProps) {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const messageId = `${triggerId}-message`;
  const menuId = `${triggerId}-menu`;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();
  const isRTL = locale === "ar";
  const canUseDOM = typeof document !== "undefined";

  const updateMenuPosition = useCallback(() => {
    const trigger = dropdownRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const spaceBelow = viewportHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const shouldOpenAbove =
      spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      80,
      shouldOpenAbove ? spaceAbove : spaceBelow,
    );
    setMenuPosition({
      top: shouldOpenAbove
        ? Math.max(
            MENU_GAP,
            rect.top - Math.min(MENU_MAX_HEIGHT, availableHeight) - MENU_GAP,
          )
        : rect.bottom + MENU_GAP,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Use controlled value if provided, otherwise use internal state
  const selectedValue = value || "";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (isOpen && searchable) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;

    setIsOpen(false);
    setSearchQuery("");

    if (onChange) {
      onChange(option.value);
    }
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!searchable || !normalizedSearchQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystack =
        `${option.label} ${option.searchText || ""}`.toLowerCase();
      return haystack.includes(normalizedSearchQuery);
    });
  }, [normalizedSearchQuery, options, searchable]);

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayLabel = selectedOption?.label || placeholder;

  const menu = isOpen ? (
    <div
      id={menuId}
      ref={menuRef}
      className={`fixed z-9999 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-fadeIn hover:shadow-xl transition-shadow duration-200`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        width: fullWidth ? menuPosition.width : undefined,
        minWidth: menuPosition.width,
      }}
    >
      {searchable && (
        <div className="border-b border-gray-200 px-3 py-2">
          <div className="relative">
            <Search
              className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ${
                isRTL ? "right-3" : "left-3"
              }`}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              placeholder={searchPlaceholder}
              className={`w-full rounded-md border border-gray-200 bg-white py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary ${
                isRTL ? "pr-9 pl-3 text-right" : "pl-9 pr-3 text-left"
              }`}
            />
          </div>
        </div>
      )}
      <ul
        className="py-1 overflow-y-auto"
        style={{ maxHeight: MENU_MAX_HEIGHT }}
        onScroll={(event) => {
          const list = event.currentTarget;
          if (list.scrollHeight - list.scrollTop - list.clientHeight <= 40) {
            onEndReached?.();
          }
        }}
      >
        {options.length === 0 ? (
          <li className="px-4 py-2.5 text-sm text-gray-400 text-center">
            {noOptionsText}
          </li>
        ) : filteredOptions.length === 0 ? (
          <li className="px-4 py-2.5 text-sm text-gray-400 text-center">
            {noResultsText}
          </li>
        ) : (
          filteredOptions.map((option, index) => (
            <li
              key={option.value}
              className="animate-slideIn"
              style={{
                animationDelay: `${index * 0.03}s`,
              }}
            >
              <button
                type="button"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={`group w-full flex items-center px-4 py-2.5 text-sm ${isRTL ? "text-right" : "text-left"} transition-all duration-200 ${
                  option.disabled
                    ? "text-gray-400 cursor-not-allowed opacity-50"
                    : selectedValue === option.value
                      ? `bg-blue-50 text-primary font-medium ${isRTL ? "border-r-2 border-primary-500" : "border-l-2 border-primary-500"}`
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
                }`}
              >
                <span>{option.label}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  ) : null;

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
      : "focus:ring-2 focus:ring-primary focus:border-transparent";

  // Error classes
  const errorClasses = error
    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
    : "";

  // Disabled classes
  const disabledClasses = disabled
    ? "bg-gray-100 cursor-not-allowed opacity-60"
    : "cursor-pointer";

  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={triggerId}
          className={`block text-sm font-medium text-gray-700 mb-1 ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div ref={dropdownRef} className="relative">
        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={selectedValue} />

        {/* Trigger Button */}
        <button
          id={triggerId}
          type="button"
          aria-controls={isOpen ? menuId : undefined}
          aria-describedby={helperText || error ? messageId : undefined}
          aria-expanded={isOpen}
          onClick={() => {
            if (disabled) return;
            if (!isOpen) {
              updateMenuPosition();
              onOpen?.();
            }
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={`
            ${fullWidth ? "w-full" : ""}
            ${sizeClasses[selectSize]}
            ${variantClasses[variant]}
            ${focusClasses}
            ${errorClasses}
            ${disabledClasses}
            ${isRTL ? "text-right" : "text-left"}
            rounded-lg
            transition-all duration-200
            hover:shadow-sm
            ${!disabled && !error ? "hover:border-gray-300" : ""}
            flex items-center justify-between
            ${className}
          `}
        >
          <span
            className={`${!selectedOption ? "text-gray-400" : "text-gray-900"}`}
          >
            {displayLabel}
          </span>
          <ChevronDown
            className={`w-4 h-4 ${error ? "text-red-500" : "text-gray-400"} transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isRTL ? "mr-2" : "ml-2"}`}
          />
        </button>

        {canUseDOM && menu ? createPortal(menu, document.body) : null}
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <div
          id={messageId}
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
}
