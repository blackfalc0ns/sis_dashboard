"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";

export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  trigger?: ReactNode;
  label?: string;
  items: DropdownItem[];
  onSelect?: (value: string) => void;
  placeholder?: string;
  className?: string;
  width?: string;
  disabled?: boolean;
}

export default function DropdownMenu({
  trigger,
  label,
  items,
  onSelect,
  placeholder = "Select an option",
  className = "",
  width = "w-48",
  disabled = false,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return;

    setSelectedValue(item.value);
    setIsOpen(false);

    if (item.onClick) {
      item.onClick();
    }

    if (onSelect) {
      onSelect(item.value);
    }
  };

  const selectedItem = items.find((item) => item.value === selectedValue);
  const displayLabel = selectedItem?.label || placeholder;

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      {trigger ? (
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="focus:outline-none cursor-pointer"
        >
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`${width} flex items-center justify-between px-4 py-2.5 bg-white border border-border rounded-lg hover:border-hover hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="flex items-center gap-2 text-sm text-black">
            {selectedItem?.icon && <span>{selectedItem.icon}</span>}
            {label && <span className="font-medium">{label}:</span>}
            <span className={selectedItem ? "" : "text-black"}>
              {displayLabel}
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-black transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 ${width} bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-fadeIn hover:shadow-xl transition-shadow duration-200 ${
            isRTL ? "left-0" : "right-0"
          }`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <ul className="py-1 max-h-60 overflow-y-auto">
            {items.map((item, index) => (
              <li
                key={item.value}
                className="animate-slideIn"
                style={{
                  animationDelay: `${index * 0.03}s`,
                }}
              >
                <button
                  onClick={() => handleSelect(item)}
                  disabled={item.disabled}
                  className={`group w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isRTL ? "text-right" : "text-left"} transition-all duration-200 ${
                    item.disabled
                      ? "text-gray-400 cursor-not-allowed opacity-50"
                      : selectedValue === item.value
                        ? `bg-blue-50 text-primary-600 font-medium ${isRTL ? "border-r-2 border-primary-500" : "border-l-2 border-primary-500"}`
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
                  }`}
                >
                  {item.icon && (
                    <span className="shrink-0 transition-all duration-200 group-hover:scale-105">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
