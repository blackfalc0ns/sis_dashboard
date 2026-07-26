"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import UserSearchSelect from "./UserSearchSelect";
import type { CommunicationSelectorOption } from "@/features/communication/api/communication-selectors.service";

export interface UserMultiSearchSelectProps {
  label: string;
  value: string[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string[]) => void;
}

export default function UserMultiSearchSelect({
  disabled,
  error,
  helperText,
  label,
  onChange,
  placeholder,
  value,
}: UserMultiSearchSelectProps) {
  const [pendingUserId, setPendingUserId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<
    Record<string, { label: string; description?: string }>
  >({});

  const addUser = (userId: string) => {
    setPendingUserId(userId);
    if (!userId || value.includes(userId)) return;
    onChange([...value, userId]);
    setPendingUserId("");
  };

  const removeUser = (userId: string) => {
    onChange(value.filter((item) => item !== userId));
    setSelectedUsers((current) => {
      const nextUsers = { ...current };
      delete nextUsers[userId];
      return nextUsers;
    });
  };

  const rememberUserLabel = (option: CommunicationSelectorOption | null) => {
    if (!option) return;
    setSelectedUsers((current) => ({
      ...current,
      [option.id]: {
        label: option.label,
        description: option.description,
      },
    }));
  };

  return (
    <div className="space-y-2">
      <UserSearchSelect
        label={label}
        value={pendingUserId}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        disabled={disabled}
        onChange={addUser}
        onOptionChange={rememberUserLabel}
      />
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((userId) => (
            <span
              key={userId}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              <span>
                {selectedUsers[userId]?.label || "Selected user"}
                {selectedUsers[userId]?.description ? (
                  <span className="text-slate-500">
                    {` · ${selectedUsers[userId].description}`}
                  </span>
                ) : null}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-5 px-1 py-0"
                disabled={disabled}
                onClick={() => removeUser(userId)}
                leftIcon={<X className="h-3 w-3" aria-hidden="true" />}
              >
                <span className="sr-only">Remove</span>
              </Button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
