"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import type { NedaaGate } from "@/features/nedaa/types/nedaa";
import { createNedaaGateIdFromName } from "@/features/nedaa/utils/nedaaPresentation";

interface NedaaGateFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialGate?: NedaaGate | null;
  existingGateIds: string[];
  onClose: () => void;
  onSubmit: (payload: {
    id: string;
    nameAr: string;
    nameEn: string;
    locationHint?: string;
    isActive: boolean;
    supportsPickup: boolean;
    isStaffOnly?: boolean;
  }) => Promise<void> | void;
}

export default function NedaaGateFormModal({
  isOpen,
  mode,
  initialGate,
  existingGateIds,
  onClose,
  onSubmit,
}: NedaaGateFormModalProps) {
  const t = useTranslations("nedaa");
  const tCommon = useTranslations("common");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [supportsPickup, setSupportsPickup] = useState(true);
  const [isStaffOnly, setIsStaffOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setNameAr(initialGate?.nameAr || "");
    setNameEn(initialGate?.nameEn || "");
    setLocationHint(initialGate?.locationHint || "");
    setIsActive(initialGate?.isActive ?? true);
    setSupportsPickup(initialGate?.supportsPickup ?? true);
    setIsStaffOnly(initialGate?.isStaffOnly ?? false);
    setIsSubmitting(false);
    setSubmitError(null);
  }, [initialGate, isOpen]);

  const generatedGateId = useMemo(
    () => initialGate?.id || createNedaaGateIdFromName(nameEn),
    [initialGate?.id, nameEn],
  );

  const duplicateIdExists =
    mode === "create" &&
    generatedGateId !== "" &&
    existingGateIds.includes(generatedGateId);
  const nameArError =
    nameAr.trim() === ""
      ? t("settings.gate_form.validation.name_ar_required")
      : undefined;
  const nameEnError =
    nameEn.trim() === ""
      ? t("settings.gate_form.validation.name_en_required")
      : undefined;
  const gateIdError = !generatedGateId
    ? t("settings.gate_form.validation.invalid_id")
    : duplicateIdExists
      ? t("settings.gate_form.validation.duplicate_id")
      : undefined;
  const canSubmit = !nameArError && !nameEnError && !gateIdError && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setSubmitError(gateIdError || nameArError || nameEnError || null);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        id: generatedGateId,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        locationHint: locationHint.trim() || undefined,
        isActive,
        supportsPickup,
        isStaffOnly,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "create"
          ? t("settings.gate_form.create_title")
          : t("settings.gate_form.edit_title")
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {tCommon("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting
              ? tCommon("saving")
              : mode === "create"
                ? t("settings.gate_form.create_action")
                : t("settings.gate_form.save_action")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label={t("settings.gate_form.name_ar")}
          value={nameAr}
          onChange={(event) => setNameAr(event.target.value)}
          error={submitError && !nameAr.trim() ? nameArError : undefined}
        />
        <Input
          label={t("settings.gate_form.name_en")}
          value={nameEn}
          onChange={(event) => setNameEn(event.target.value)}
          error={submitError && !nameEn.trim() ? nameEnError : undefined}
        />
        <Input
          label={t("settings.gate_form.generated_id")}
          value={generatedGateId}
          disabled
          helperText={t("settings.gate_form.generated_id_help")}
          error={submitError ? gateIdError : undefined}
          dir="ltr"
        />
        <Input
          label={t("settings.gate_form.location_hint")}
          value={locationHint}
          onChange={(event) => setLocationHint(event.target.value)}
          placeholder={t("settings.gate_form.location_hint_placeholder")}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-gray-900">
                {t("settings.gate_form.active_toggle")}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("settings.gate_form.active_toggle_help")}
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={supportsPickup}
              onChange={(event) => setSupportsPickup(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-gray-900">
                {t("settings.gate_form.supports_pickup_toggle")}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("settings.gate_form.supports_pickup_toggle_help")}
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 md:col-span-2">
            <input
              type="checkbox"
              checked={isStaffOnly}
              onChange={(event) => setIsStaffOnly(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-gray-900">
                {t("settings.gate_form.staff_only_toggle")}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("settings.gate_form.staff_only_toggle_help")}
              </p>
            </div>
          </label>
        </div>

        {submitError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}