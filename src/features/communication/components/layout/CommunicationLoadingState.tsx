import type { ReactNode } from "react";
import { CircularProgress } from "@mui/material";

export interface CommunicationLoadingStateProps {
  label?: ReactNode;
  className?: string;
  size?: number;
}

export default function CommunicationLoadingState({
  label,
  className = "",
  size = 32,
}: CommunicationLoadingStateProps) {
  return (
    <div
      className={`flex min-h-64 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center ${className}`}
      aria-live="polite"
      aria-busy="true"
    >
      <CircularProgress size={size} />
      {label ? (
        <p className="mt-4 text-sm font-medium text-slate-600">{label}</p>
      ) : null}
    </div>
  );
}
