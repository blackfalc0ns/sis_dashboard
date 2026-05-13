"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/ui/input/Select";
import type {
  BulkCredentialPreviewRequest,
  BulkCredentialPreviewResponse,
} from "@/features/settings/credentials/types";
import type { RoleDefinition, UserAdminStatus } from "@/features/settings/types";

interface BulkGenerateCredentialsModalProps {
  isOpen: boolean;
  roles: RoleDefinition[];
  preview: BulkCredentialPreviewResponse | null;
  isPreviewing: boolean;
  isGenerating: boolean;
  error?: string | null;
  onClose: () => void;
  onPreview: (payload: BulkCredentialPreviewRequest) => Promise<void>;
  onGenerate: (
    payload: BulkCredentialPreviewRequest & { mustChangePassword: boolean },
  ) => Promise<void>;
  labels: {
    title: string;
    description: string;
    role: string;
    status: string;
    all: string;
    active: string;
    invited: string;
    inactive: string;
    missingOnly: string;
    mustChangeOnly: string;
    forceChange: string;
    preview: string;
    previewing: string;
    generate: string;
    generating: string;
    cancel: string;
    eligible: string;
    skipped: string;
  };
}

export default function BulkGenerateCredentialsModal({
  isOpen,
  roles,
  preview,
  isPreviewing,
  isGenerating,
  error,
  onClose,
  onPreview,
  onGenerate,
  labels,
}: BulkGenerateCredentialsModalProps) {
  const [roleId, setRoleId] = useState("all");
  const [status, setStatus] = useState<UserAdminStatus | "all">("all");
  const [missingPasswordOnly, setMissingPasswordOnly] = useState(true);
  const [mustChangePasswordOnly, setMustChangePasswordOnly] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(true);

  const buildPayload = (): BulkCredentialPreviewRequest => ({
    roleId: roleId === "all" ? undefined : roleId,
    status: status === "all" ? undefined : status,
    missingPasswordOnly,
    mustChangePasswordOnly,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={labels.title}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            variant="secondary"
            loading={isPreviewing}
            onClick={() => void onPreview(buildPayload())}
          >
            {isPreviewing ? labels.previewing : labels.preview}
          </Button>
          <Button
            variant="primary"
            loading={isGenerating}
            disabled={!preview || preview.eligibleCount < 1 || isGenerating}
            onClick={() =>
              void onGenerate({ ...buildPayload(), mustChangePassword })
            }
          >
            {isGenerating ? labels.generating : labels.generate}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{labels.description}</p>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={labels.role}
            value={roleId}
            onChange={setRoleId}
            options={[
              { value: "all", label: labels.all },
              ...roles.map((role) => ({ value: role.id, label: role.name })),
            ]}
          />
          <Select
            label={labels.status}
            value={status}
            onChange={(value) => setStatus(value as UserAdminStatus | "all")}
            options={[
              { value: "all", label: labels.all },
              { value: "active", label: labels.active },
              { value: "invited", label: labels.invited },
              { value: "inactive", label: labels.inactive },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              checked: missingPasswordOnly,
              label: labels.missingOnly,
              onChange: setMissingPasswordOnly,
            },
            {
              checked: mustChangePasswordOnly,
              label: labels.mustChangeOnly,
              onChange: setMustChangePasswordOnly,
            },
            {
              checked: mustChangePassword,
              label: labels.forceChange,
              onChange: setMustChangePassword,
            },
          ].map((option) => (
            <label
              key={option.label}
              className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300"
                checked={option.checked}
                onChange={(event) => option.onChange(event.target.checked)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {preview ? (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                {labels.eligible}:{" "}
                <strong className="text-gray-900">{preview.eligibleCount}</strong>
              </span>
              <span>
                {labels.skipped}:{" "}
                <strong className="text-gray-900">{preview.skippedCount}</strong>
              </span>
            </div>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {preview.recipients.map((recipient) => (
                <div
                  key={recipient.userId}
                  className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-900">
                      {recipient.fullName}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {recipient.username || recipient.email}
                    </span>
                  </span>
                  <span
                    className={
                      recipient.eligible ? "text-green-700" : "text-gray-500"
                    }
                  >
                    {recipient.eligible
                      ? labels.eligible
                      : recipient.skipReason || labels.skipped}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
