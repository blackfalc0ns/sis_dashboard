"use client";

import { Search, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type {
  MessageReportFiltersState,
  MessageReportStatusFilter,
} from "@/features/communication/hooks/useMessageReports";

export interface ReportFiltersProps {
  filters: MessageReportFiltersState;
  onChange: (filters: MessageReportFiltersState) => void;
  labels: {
    status: string;
    open: string;
    inReview: string;
    resolved: string;
    reason: string;
    reasonPlaceholder: string;
    clear: string;
  };
}

export default function ReportFilters({
  filters,
  labels,
  onChange,
}: ReportFiltersProps) {
  const statusOptions: Array<{ value: MessageReportStatusFilter; label: string }> = [
    { value: "open", label: labels.open },
    { value: "in_review", label: labels.inReview },
    { value: "resolved", label: labels.resolved },
  ];

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[220px_1fr_auto] lg:items-end">
      <Select
        label={labels.status}
        value={filters.status}
        onChange={(value) =>
          onChange({ ...filters, status: value as MessageReportStatusFilter })
        }
        options={statusOptions}
      />
      <Input
        label={labels.reason}
        placeholder={labels.reasonPlaceholder}
        value={filters.reason}
        leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
        onChange={(event) =>
          onChange({ ...filters, reason: event.target.value })
        }
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => onChange({ status: "open", reason: "" })}
        leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
      >
        {labels.clear}
      </Button>
    </div>
  );
}
