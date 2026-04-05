"use client";

import { X } from "lucide-react";
import { FilterPanel } from "@/components/ui";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type { NedaaGateId, NedaaStatus } from "@/features/nedaa/types/nedaa";

interface NedaaFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  gate: string;
  onGateChange: (value: string) => void;
  statusOptions: NedaaStatus[];
  gateOptions: NedaaGateId[];
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  searchPlaceholder: string;
  toggleTitle: string;
  allStatusesLabel: string;
  allGatesLabel: string;
  statusLabel: string;
  gateLabel: string;
  filterButtonLabel: string;
  clearFiltersLabel: string;
  gateLabelForValue: (gate: NedaaGateId) => string;
  statusLabelForValue: (status: NedaaStatus) => string;
}

export default function NedaaFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  gate,
  onGateChange,
  statusOptions,
  gateOptions,
  showFilters,
  onToggleFilters,
  onClearFilters,
  hasActiveFilters,
  searchPlaceholder,
  toggleTitle,
  allStatusesLabel,
  allGatesLabel,
  statusLabel,
  gateLabel,
  filterButtonLabel,
  clearFiltersLabel,
  gateLabelForValue,
  statusLabelForValue,
}: NedaaFiltersProps) {
  return (
    <FilterPanel
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      hasActiveFilters={hasActiveFilters}
      toggleTitle={filterButtonLabel}
      toggleAriaLabel={filterButtonLabel}
      clearAction={
        hasActiveFilters ? (
          <Button
            variant="outline"
            leftIcon={<X className="h-4 w-4" />}
            onClick={onClearFilters}
          >
            {clearFiltersLabel}
          </Button>
        ) : null
      }
      searchSlot={
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      }
      filtersSlot={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label={statusLabel}
            value={status}
            onChange={onStatusChange}
            options={[
              { value: "all", label: allStatusesLabel },
              ...statusOptions.map((value) => ({
                value,
                label: statusLabelForValue(value),
              })),
            ]}
          />
          <Select
            label={gateLabel}
            value={gate}
            onChange={onGateChange}
            options={[
              { value: "all", label: allGatesLabel },
              ...gateOptions.map((value) => ({
                value,
                label: gateLabelForValue(value),
              })),
            ]}
          />
        </div>
      }
      className="bg-white shadow-sm"
      bodySlot={
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
          {toggleTitle}
        </div>
      }
    />
  );
}
