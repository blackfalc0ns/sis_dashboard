"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import type { CredentialStatusRecord } from "@/features/settings/credentials/types";

interface GenerateCredentialModalProps {
  isOpen: boolean;
  mode: "generate" | "regenerate";
  user: CredentialStatusRecord | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (mustChangePassword: boolean) => Promise<void>;
  labels: {
    generateTitle: string;
    regenerateTitle: string;
    description: string;
    mustChangePassword: string;
    cancel: string;
    generate: string;
    regenerate: string;
    generating: string;
  };
}

export default function GenerateCredentialModal({
  isOpen,
  mode,
  user,
  isSubmitting,
  onClose,
  onSubmit,
  labels,
}: GenerateCredentialModalProps) {
  const [mustChangePassword, setMustChangePassword] = useState(true);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "generate" ? labels.generateTitle : labels.regenerateTitle}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            onClick={() => void onSubmit(mustChangePassword)}
          >
            {isSubmitting
              ? labels.generating
              : mode === "generate"
                ? labels.generate
                : labels.regenerate}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{labels.description}</p>
        {user ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="font-semibold text-gray-900">{user.fullName}</p>
            <p className="break-all text-gray-500">
              {user.username || user.loginEmail || user.email}
            </p>
          </div>
        ) : null}
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300"
            checked={mustChangePassword}
            onChange={(event) => setMustChangePassword(event.target.checked)}
          />
          <span>{labels.mustChangePassword}</span>
        </label>
      </div>
    </Modal>
  );
}
