import { X } from "lucide-react";

export function ToastMessage({
  closeLabel,
  message,
  onClose,
  tone,
}: {
  closeLabel: string;
  message: string;
  onClose: () => void;
  tone: "success" | "error" | "info";
}) {
  const classes = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return (
    <div
      className={`absolute bottom-5 left-1/2 z-50 flex max-w-[min(520px,90vw)] -translate-x-1/2 items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${classes[tone]}`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 hover:bg-white/60"
        aria-label={closeLabel}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
