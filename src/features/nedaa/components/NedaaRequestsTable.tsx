"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DataTable } from "@/components/ui";
import NedaaStatusBadge from "@/features/nedaa/components/NedaaStatusBadge";
import type {
  NedaaGate,
  NedaaRequest,
  NedaaStatus,
} from "@/features/nedaa/types/nedaa";
import {
  getNedaaActionStatuses,
  getNedaaGateLabel,
} from "@/features/nedaa/utils/nedaaPresentation";
import { formatDateTime } from "@/utils/formatters/dateTime";

interface NedaaRequestsTableProps {
  requests: NedaaRequest[];
  gates?: NedaaGate[];
  searchQuery?: string;
  mode?: "operations" | "history" | "latest";
  onRowClick?: (request: NedaaRequest) => void;
  onStatusChange?: (requestId: string, status: NedaaStatus) => void;
  pendingRequestId?: string | null;
  isReadOnly?: boolean;
  showPagination?: boolean;
  itemsPerPage?: number;
}

function PermissionBadge({
  value,
  yesLabel,
  noLabel,
}: {
  value: boolean;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        value
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700"
      }`}
    >
      {value ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {value ? yesLabel : noLabel}
    </span>
  );
}

export default function NedaaRequestsTable({
  requests,
  gates = [],
  searchQuery = "",
  mode = "operations",
  onRowClick,
  onStatusChange,
  pendingRequestId = null,
  isReadOnly = false,
  showPagination = true,
  itemsPerPage = 10,
}: NedaaRequestsTableProps) {
  const locale = useLocale();
  const t = useTranslations("nedaa");

  const commonColumns = [
    {
      key: "id",
      label: t("table.request_id"),
      searchable: true,
    },
    {
      key: "studentName",
      label: t("table.student"),
      searchable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div>
          <p className="font-medium text-gray-900">{String(value)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {String(row.studentId || "")}
          </p>
        </div>
      ),
    },
    {
      key: "guardianName",
      label: t("table.guardian"),
      searchable: true,
    },
    {
      key: "guardianRelation",
      label: t("table.relation"),
      render: (value: unknown) => (
        <span className="capitalize text-gray-600">{String(value)}</span>
      ),
    },
    {
      key: "gate",
      label: t("table.gate"),
      render: (value: unknown) =>
        getNedaaGateLabel(String(value), gates, locale),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (value: unknown) => (
        <NedaaStatusBadge status={value as NedaaStatus} />
      ),
    },
  ];

  const permissionColumns = [
    {
      key: "canPickup",
      label: t("table.can_pickup"),
      render: (value: unknown) => (
        <PermissionBadge
          value={Boolean(value)}
          yesLabel={t("table.allowed")}
          noLabel={t("table.blocked")}
        />
      ),
    },
    {
      key: "canReceiveNotifications",
      label: t("table.notifications"),
      render: (value: unknown) => (
        <PermissionBadge
          value={Boolean(value)}
          yesLabel={t("table.enabled")}
          noLabel={t("table.disabled")}
        />
      ),
    },
  ];

  const actionsColumn = {
    key: "actions",
    label: t("table.actions"),
    sortable: false,
    render: (_value: unknown, row: Record<string, unknown>) => {
      const request = row as unknown as NedaaRequest;
      const actions = getNedaaActionStatuses(request.status);

      if (actions.length === 0) {
        return <span className="text-xs text-gray-400">{t("table.no_actions")}</span>;
      }

      return (
        <div className="flex flex-wrap gap-2">
          {actions.map((nextStatus) => (
            <button
              key={`${request.id}-${nextStatus}`}
              type="button"
              disabled={
                isReadOnly ||
                pendingRequestId === request.id ||
                !onStatusChange
              }
              onClick={(event) => {
                event.stopPropagation();
                onStatusChange?.(request.id, nextStatus);
              }}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t(`actions.${nextStatus}`)}
            </button>
          ))}
        </div>
      );
    },
  };

  const createdAtColumn = {
    key: "createdAt",
    label: t("table.created_at"),
    render: (value: unknown) => formatDateTime(String(value), locale),
  };

  const updatedAtColumn = {
    key: "updatedAt",
    label: t("table.updated_at"),
    render: (value: unknown) => formatDateTime(String(value), locale),
  };

  const latestColumns = [...commonColumns, createdAtColumn];
  const historyColumns = [
    ...commonColumns,
    updatedAtColumn,
    ...permissionColumns,
  ];
  const operationsColumns = [
    ...commonColumns,
    createdAtColumn,
    ...permissionColumns,
    actionsColumn,
  ];

  const columns =
    mode === "latest"
      ? latestColumns
      : mode === "history"
        ? historyColumns
        : operationsColumns;

  return (
    <DataTable
      columns={columns}
      data={requests as unknown as Record<string, unknown>[]}
      searchQuery={searchQuery}
      onRowClick={
        onRowClick
          ? (row) => onRowClick(row as unknown as NedaaRequest)
          : undefined
      }
      showPagination={showPagination}
      itemsPerPage={itemsPerPage}
    />
  );
}