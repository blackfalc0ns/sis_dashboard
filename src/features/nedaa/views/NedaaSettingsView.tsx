"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type { NedaaGateId, NedaaSettings } from "@/features/nedaa/types/nedaa";

interface NedaaSettingsViewProps {
  settings: NedaaSettings;
  initialSettings: NedaaSettings;
  isSaving?: boolean;
  isReadOnly?: boolean;
  onChange: (updates: Partial<NedaaSettings>) => void;
  onToggleGate: (gate: NedaaGateId) => void;
  onReset: () => void;
  onSave: () => void;
}

export default function NedaaSettingsView({
  settings,
  initialSettings,
  isSaving = false,
  isReadOnly = false,
  onChange,
  onToggleGate,
  onReset,
  onSave,
}: NedaaSettingsViewProps) {
  const t = useTranslations("nedaa");
  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("settings.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={!isDirty || isSaving || isReadOnly}
            onClick={onReset}
          >
            {t("settings.reset")}
          </Button>
          <Button
            loading={isSaving}
            disabled={!isDirty || isSaving || isReadOnly}
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
            disabled={isReadOnly}
            onChange={(event) =>
              onChange({ allowedRadiusMeters: Number(event.target.value || 0) })
            }
          />
          <Input
            type="number"
            label={t("settings.duplicate_cooldown")}
            value={String(settings.duplicateRequestCooldownMinutes)}
            disabled={isReadOnly}
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
            disabled={isReadOnly}
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
            disabled={isReadOnly}
            onChange={(event) => onChange({ pickupStartTime: event.target.value })}
          />
          <Input
            type="time"
            label={t("settings.pickup_end")}
            value={settings.pickupEndTime}
            disabled={isReadOnly}
            onChange={(event) => onChange({ pickupEndTime: event.target.value })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("settings.active_gates_title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("settings.active_gates_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(["main_gate", "north_gate", "south_gate", "staff_gate"] as NedaaGateId[]).map(
            (gate) => (
              <label
                key={gate}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  settings.activeGates.includes(gate)
                    ? "border-primary bg-primary/5 text-gray-900"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings.activeGates.includes(gate)}
                  disabled={isReadOnly}
                  onChange={() => onToggleGate(gate)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                {t(`gates.${gate}`)}
              </label>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
