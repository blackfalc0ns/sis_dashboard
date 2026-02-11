// FILE: src/components/leads/LeadStatusBadge.tsx

import React from "react";
import { LeadStatus } from "@/types/leads";

interface LeadStatusBadgeProps {
  status: LeadStatus;
  size?: "sm" | "md";
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  New: { label: "New", className: "bg-green-100 text-green-700" },
  Contacted: { label: "Contacted", className: "bg-blue-100 text-blue-700" },
};

export default function LeadStatusBadge({
  status,
  size = "sm",
}: LeadStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
}
