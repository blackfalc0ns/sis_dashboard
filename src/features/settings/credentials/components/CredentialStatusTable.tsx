"use client";

import { KeyRound, Pencil, RefreshCcw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { DataTable } from "@/components/ui";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import type { CredentialStatusRecord } from "@/features/settings/credentials/types";

interface CredentialStatusTableProps {
  records: CredentialStatusRecord[];
  searchQuery: string;
  page: number;
  limit: number;
  total: number;
  canManage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onGenerate: (record: CredentialStatusRecord) => void;
  onSetPassword: (record: CredentialStatusRecord) => void;
  onRegenerate: (record: CredentialStatusRecord) => void;
  labels: {
    name: string;
    usernameLogin: string;
    contactEmail: string;
    role: string;
    status: string;
    hasPassword: string;
    mustChangePassword: string;
    provisionedAt: string;
    changedAt: string;
    version: string;
    actions: string;
    yes: string;
    no: string;
    notAvailable: string;
    generate: string;
    setPassword: string;
    regenerate: string;
  };
}

function formatDate(value: string | null | undefined, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

export default function CredentialStatusTable({
  records,
  searchQuery,
  page,
  limit,
  total,
  canManage,
  onPageChange,
  onPageSizeChange,
  onGenerate,
  onSetPassword,
  onRegenerate,
  labels,
}: CredentialStatusTableProps) {
  const columns = [
    {
      key: "fullName",
      label: labels.name,
      searchable: true,
      render: (value: unknown, row: Record<string, unknown>) => {
        const record = row as unknown as CredentialStatusRecord;
        return (
          <div>
            <p className="font-semibold text-gray-900">{String(value)}</p>
            <p className="mt-1 text-xs text-gray-500">
              {record.username || labels.notAvailable}
            </p>
          </div>
        );
      },
    },
    {
      key: "email",
      label: labels.usernameLogin,
      searchable: true,
      render: (value: unknown, row: Record<string, unknown>) => {
        const record = row as unknown as CredentialStatusRecord;
        return (
          <div className="min-w-48">
            <p className="break-all text-sm text-gray-900">
              {record.username || labels.notAvailable}
            </p>
            <p className="mt-1 break-all text-xs text-gray-500">
              {record.loginEmail || String(value || labels.notAvailable)}
            </p>
          </div>
        );
      },
    },
    {
      key: "contactEmail",
      label: labels.contactEmail,
      searchable: true,
      render: (value: unknown) => (
        <span className="break-all">
          {String(value || labels.notAvailable)}
        </span>
      ),
    },
    {
      key: "roleName",
      label: labels.role,
      render: (value: unknown, row: Record<string, unknown>) => {
        const record = row as unknown as CredentialStatusRecord;
        return String(value || record.roleId || labels.notAvailable);
      },
    },
    {
      key: "status",
      label: labels.status,
      render: (value: unknown) => (
        <SettingsStatusBadge status={value as CredentialStatusRecord["status"]} />
      ),
    },
    {
      key: "hasPassword",
      label: labels.hasPassword,
      render: (value: unknown) => (value ? labels.yes : labels.no),
    },
    {
      key: "mustChangePassword",
      label: labels.mustChangePassword,
      render: (value: unknown) => (value ? labels.yes : labels.no),
    },
    {
      key: "passwordProvisionedAt",
      label: labels.provisionedAt,
      render: (value: unknown) =>
        formatDate(value as string | null | undefined, labels.notAvailable),
    },
    {
      key: "passwordChangedAt",
      label: labels.changedAt,
      render: (value: unknown) =>
        formatDate(value as string | null | undefined, labels.notAvailable),
    },
    {
      key: "credentialVersion",
      label: labels.version,
      render: (value: unknown) => String(value || labels.notAvailable),
    },
    {
      key: "userId",
      label: labels.actions,
      sortable: false,
      render: (_value: unknown, row: Record<string, unknown>) => {
        const record = row as unknown as CredentialStatusRecord;
        if (!canManage) {
          return null;
        }
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-lg border border-gray-200 p-0"
              title={labels.generate}
              aria-label={labels.generate}
              onClick={(event) => {
                event.stopPropagation();
                onGenerate(record);
              }}
            >
              <KeyRound className="h-4 w-4 text-info" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-lg border border-gray-200 p-0"
              title={labels.setPassword}
              aria-label={labels.setPassword}
              onClick={(event) => {
                event.stopPropagation();
                onSetPassword(record);
              }}
            >
              <Pencil className="h-4 w-4 text-warning" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-lg border border-gray-200 p-0"
              title={labels.regenerate}
              aria-label={labels.regenerate}
              onClick={(event) => {
                event.stopPropagation();
                onRegenerate(record);
              }}
            >
              <RefreshCcw className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records as unknown as Record<string, unknown>[]}
      showPagination
      itemsPerPage={limit}
      searchQuery={searchQuery}
      serverPagination={{
        enabled: true,
        currentPage: page,
        pageSize: limit,
        totalItems: total,
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
