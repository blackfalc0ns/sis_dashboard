import type { ReactNode } from "react";
import { Alert } from "@mui/material";

export interface CommunicationErrorStateProps {
  title?: ReactNode;
  message: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function CommunicationErrorState({
  title,
  message,
  action,
  className = "",
}: CommunicationErrorStateProps) {
  return (
    <Alert
      severity="error"
      className={`rounded-lg border border-rose-200 bg-rose-50 ${className}`}
    >
      {title ? (
        <div className="mb-1 font-semibold text-rose-950">{title}</div>
      ) : null}
      <div className="text-sm leading-6 text-rose-800">{message}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </Alert>
  );
}
