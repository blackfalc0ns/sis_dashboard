import type { AttendanceBehaviorFilters } from "../types";

interface BehaviorFiltersBarProps {
  filters: AttendanceBehaviorFilters;
  onChange: (next: AttendanceBehaviorFilters) => void;
}

export default function BehaviorFiltersBar({ filters, onChange }: BehaviorFiltersBarProps) {
  return (
    <div className="text-sm" style={{ color: "var(--text-muted)" }}>
      Behavior filters bar placeholder
      <button type="button" className="sr-only" onClick={() => onChange(filters)}>
        noop
      </button>
    </div>
  );
}
