"use client";

import { Download, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import NedaaGateFormModal from "@/features/nedaa/components/NedaaGateFormModal";
import type { NedaaGate, NedaaSettings } from "@/features/nedaa/types/nedaa";
import {
  getNedaaDefaultGateOptions,
  getNedaaOrderedGates,
} from "@/features/nedaa/utils/nedaaPresentation";

interface NedaaSettingsViewProps {
  settings: NedaaSettings;
  initialSettings: NedaaSettings;
  isSaving?: boolean;
  isReadOnly?: boolean;
  canManage?: boolean;
  manageNotice?: string | null;
  isGateModalOpen: boolean;
  gateModalMode: "create" | "edit";
  editingGate?: NedaaGate | null;
  onChange: (updates: Partial<NedaaSettings>) => void;
  onReset: () => void;
  onSave: () => void;
  onOpenExport: () => void;
  onOpenCreateGate: () => void;
  onOpenEditGate: (gate: NedaaGate) => void;
  onCloseGateModal: () => void;
  onSubmitGate: (payload: {
    id: string;
    nameAr: string;
    nameEn: string;
    locationHint?: string;
    isActive: boolean;
    supportsPickup: boolean;
    isStaffOnly?: boolean;
  }) => Promise<void> | void;
  onToggleGateActive: (gateId: string) => void;
  onDeleteGate: (gateId: string) => void;
}

function GateMetaBadge({
  label,
  tone,
}: {
  label: string;
  tone: "emerald" | "slate" | "blue" | "amber";
}) {
  const toneClasses: Record<"emerald" | "slate" | "blue" | "amber", string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

export default function NedaaSettingsView({
  settings,
  initialSettings,
  isSaving = false,
  isReadOnly = false,
  canManage = true,
  manageNotice = null,
  isGateModalOpen,
  gateModalMode,
  editingGate = null,
  onChange,
  onReset,
  onSave,
  onOpenExport,
  onOpenCreateGate,
  onOpenEditGate,
  onCloseGateModal,
  onSubmitGate,
  onToggleGateActive,
  onDeleteGate,
}: NedaaSettingsViewProps) {
  const t = useTranslations("nedaa");
  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);
  const canEdit = canManage && !isReadOnly;
  const orderedGates = useMemo(
    () => getNedaaOrderedGates(settings.gates),
    [settings.gates],
  );
  const defaultGateOptions = useMemo(
    () => getNedaaDefaultGateOptions(settings.gates),
    [settings.gates],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("settings.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onOpenExport}
          >
            <Download className="h-4 w-4" />
            {t("export.button")}
          </Button>
          <Button
            variant="secondary"
            disabled={!isDirty || isSaving || !canEdit}
            onClick={onReset}
          >
            {t("settings.reset")}
          </Button>
          <Button
            loading={isSaving}
            disabled={!isDirty || isSaving || !canEdit}
            onClick={onSave}
          >
            {t("settings.save")}
          </Button>
        </div>
      </div>

      {isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("read_only_notice")}
        </div>
      ) : null}

      {!isReadOnly && !canManage && manageNotice ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {manageNotice}
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("settings.rules_title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("settings.rules_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            type="number"
            label={t("settings.allowed_radius")}
            value={String(settings.allowedRadiusMeters)}
            disabled={!canEdit}
            onChange={(event) =>
              onChange({ allowedRadiusMeters: Number(event.target.value || 0) })
            }
          />
          <Input
            type="number"
            label={t("settings.duplicate_cooldown")}
            value={String(settings.duplicateRequestCooldownMinutes)}
            disabled={!canEdit}
            onChange={(event) =>
              onChange({
                duplicateRequestCooldownMinutes: Number(
                  event.target.value || 0,
                ),
              })
            }
          />
          <Input
            type="number"
            label={t("settings.auto_cancel_timeout")}
            value={String(settings.autoCancelTimeoutMinutes)}
            disabled={!canEdit}
            onChange={(event) =>
              onChange({
                autoCancelTimeoutMinutes: Number(event.target.value || 0),
              })
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("settings.pickup_window_title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("settings.pickup_window_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            type="time"
            label={t("settings.pickup_start")}
            value={settings.pickupStartTime}
            disabled={!canEdit}
            onChange={(event) => onChange({ pickupStartTime: event.target.value })}
          />
          <Input
            type="time"
            label={t("settings.pickup_end")}
            value={settings.pickupEndTime}
            disabled={!canEdit}
            onChange={(event) => onChange({ pickupEndTime: event.target.value })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t("settings.gate_management_title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("settings.gate_management_subtitle")}
            </p>
          </div>
          <div className="w-full max-w-sm">
            <Select
              label={t("settings.default_gate")}
              value={settings.defaultGateId || ""}
              disabled={!canEdit}
              onChange={(value) =>
                onChange({ defaultGateId: value ? value : null })
              }
              options={[
                {
                  value: "",
                  label: t("settings.no_default_gate"),
                },
                ...defaultGateOptions.map((gate) => ({
                  value: gate.id,
                  label: `${gate.nameEn} / ${gate.nameAr}`,
                })),
              ]}
            />
          </div>
        </div>

        <div className="mb-4 flex justify-end">
          <Button
            variant="secondary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={onOpenCreateGate}
            disabled={!canEdit}
          >
            {t("settings.add_gate")}
          </Button>
        </div>

        {orderedGates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-900">
              {t("settings.gate_management_empty_title")}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {t("settings.gate_management_empty_description")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orderedGates.map((gate) => (
              <div
                key={gate.id}
                className="rounded-2xl border border-gray-200 px-4 py-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {gate.nameEn}
                        </h3>
                        {settings.defaultGateId === gate.id ? (
                          <GateMetaBadge
                            label={t("settings.default_gate_badge")}
                            tone="blue"
                          />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{gate.nameAr}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <GateMetaBadge
                        label={
                          gate.isActive
                            ? t("settings.gate_status.active")
                            : t("settings.gate_status.inactive")
                        }
                        tone={gate.isActive ? "emerald" : "slate"}
                      />
                      <GateMetaBadge
                        label={
                          gate.supportsPickup
                            ? t("settings.gate_status.supports_pickup")
                            : t("settings.gate_status.no_pickup")
                        }
                        tone={gate.supportsPickup ? "amber" : "slate"}
                      />
                      {gate.isStaffOnly ? (
                        <GateMetaBadge
                          label={t("settings.gate_status.staff_only")}
                          tone="blue"
                        />
                      ) : null}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium text-gray-900">
                          {t("settings.gate_form.generated_id")}:
                        </span>{" "}
                        <span className="font-mono text-xs uppercase tracking-wide text-gray-500">
                          {gate.id}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          {t("settings.gate_form.location_hint")}:
                        </span>{" "}
                        {gate.locationHint || t("settings.no_location_hint")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenEditGate(gate)}
                      disabled={!canEdit}
                    >
                      {t("settings.edit_gate")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleGateActive(gate.id)}
                      disabled={!canEdit}
                    >
                      {gate.isActive
                        ? t("settings.deactivate_gate")
                        : t("settings.activate_gate")}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => onDeleteGate(gate.id)}
                      disabled={!canEdit}
                    >
                      {t("settings.delete_gate")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <NedaaGateFormModal
        isOpen={isGateModalOpen}
        mode={gateModalMode}
        initialGate={editingGate}
        existingGateIds={orderedGates.map((gate) => gate.id)}
        onClose={onCloseGateModal}
        onSubmit={onSubmitGate}
      />


    </div>
  );
}
