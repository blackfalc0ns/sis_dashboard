interface BehaviorActionModalsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BehaviorActionModals({ isOpen, onClose }: BehaviorActionModalsProps) {
  if (!isOpen) return null;

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-color)" }}>
      <p className="text-sm">Behavior action modal placeholder</p>
      <button type="button" onClick={onClose} className="mt-2 text-xs underline">
        Close
      </button>
    </div>
  );
}
