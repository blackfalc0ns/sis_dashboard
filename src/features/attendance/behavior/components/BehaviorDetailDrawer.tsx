import type { AttendanceBehaviorRow } from "../types";

interface BehaviorDetailDrawerProps {
  row: AttendanceBehaviorRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BehaviorDetailDrawer({ row, isOpen, onClose }: BehaviorDetailDrawerProps) {
  if (!isOpen || !row) return null;

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-color)" }}>
      <p className="text-sm font-semibold">{row.studentName}</p>
      <button type="button" onClick={onClose} className="mt-2 text-xs underline">
        Close
      </button>
    </div>
  );
}
