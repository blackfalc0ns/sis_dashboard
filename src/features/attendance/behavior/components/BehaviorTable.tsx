import type { AttendanceBehaviorRow } from "../types";

interface BehaviorTableProps {
  rows: AttendanceBehaviorRow[];
  onRowClick: (row: AttendanceBehaviorRow) => void;
}

export default function BehaviorTable({ rows, onRowClick }: BehaviorTableProps) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-color)" }}>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Behavior table placeholder ({rows.length} rows)
      </p>
      {rows[0] ? (
        <button type="button" className="sr-only" onClick={() => onRowClick(rows[0])}>
          open first row
        </button>
      ) : null}
    </div>
  );
}
