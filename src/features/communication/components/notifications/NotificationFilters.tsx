"use client";

import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import type {
  NotificationFiltersState,
  NotificationStatusFilter,
} from "@/features/communication/hooks/useNotifications";

export interface NotificationFiltersProps {
  filters: NotificationFiltersState;
  onChange: (filters: NotificationFiltersState) => void;
  labels: {
    status: string;
    all: string;
    unread: string;
    read: string;
    clear: string;
  };
}

export default function NotificationFilters({
  filters,
  labels,
  onChange,
}: NotificationFiltersProps) {
  const statusOptions: Array<{ value: NotificationStatusFilter; label: string }> = [
    { value: "all", label: labels.all },
    { value: "unread", label: labels.unread },
    { value: "read", label: labels.read },
  ];

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,260px)_auto] sm:items-end">
      <Select
        label={labels.status}
        value={filters.status}
        onChange={(value) =>
          onChange({ status: value as NotificationStatusFilter })
        }
        options={statusOptions}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => onChange({ status: "all" })}
        leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
      >
        {labels.clear}
      </Button>
    </div>
  );
}
