"use client";

import type {
  EmailTemplate,
  EmailTemplateKey,
} from "@/features/settings/email/templates/types";

interface TemplateKeyTabsProps {
  keys: EmailTemplateKey[];
  selectedKey: EmailTemplateKey;
  templatesByKey: Map<EmailTemplateKey, EmailTemplate>;
  onSelect: (key: EmailTemplateKey) => void;
  labels: Record<EmailTemplateKey, string>;
  activeLabel: string;
  inactiveLabel: string;
}

export default function TemplateKeyTabs({
  keys,
  selectedKey,
  templatesByKey,
  onSelect,
  labels,
  activeLabel,
  inactiveLabel,
}: TemplateKeyTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2">
      {keys.map((key) => {
        const isSelected = selectedKey === key;
        const template = templatesByKey.get(key);
        return (
          <button
            key={key}
            type="button"
            className={`shrink-0 flex gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => onSelect(key)}
          >
            <span>{labels[key]}</span>
            <div
              className={`rounded-full px-2 py-0.5 text-xs ${
                isSelected
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {template?.isActive ? activeLabel : inactiveLabel}
            </div>
          </button>
        );
      })}
    </div>
  );
}
