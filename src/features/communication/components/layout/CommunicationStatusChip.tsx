import { Chip } from "@mui/material";

export type CommunicationStatusTone =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "error";

export interface CommunicationStatusChipProps {
  label: string;
  tone?: CommunicationStatusTone;
  size?: "small" | "medium";
  className?: string;
}

const toneClasses: Record<CommunicationStatusTone, string> = {
  default: "bg-slate-100 text-slate-700",
  info: "bg-sky-100 text-sky-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-rose-100 text-rose-700",
};

export default function CommunicationStatusChip({
  label,
  tone = "default",
  size = "small",
  className = "",
}: CommunicationStatusChipProps) {
  return (
    <Chip
      label={label}
      size={size}
      className={`font-medium ${toneClasses[tone]} ${className}`}
    />
  );
}
