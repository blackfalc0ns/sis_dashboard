"use client";

import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type { PatchXpPolicyPayload, XpPolicy } from "../types";
import { useState } from "react";

interface XpPolicyTableProps {
  policies: XpPolicy[];
  loading?: boolean;
  canManage?: boolean;
  onPatchCaps: (policyId: string, payload: PatchXpPolicyPayload) => Promise<void>;
}

function numberValue(value?: number): string {
  return typeof value === "number" ? String(value) : "";
}

function PatchCapsRow({
  policy,
  onPatchCaps,
}: {
  policy: XpPolicy;
  onPatchCaps: (policyId: string, payload: PatchXpPolicyPayload) => Promise<void>;
}) {
  const t = useTranslations("reinforcement");
  const [dailyCap, setDailyCap] = useState(numberValue(policy.dailyCap));
  const [weeklyCap, setWeeklyCap] = useState(numberValue(policy.weeklyCap));
  const [cooldownMinutes, setCooldownMinutes] = useState(
    numberValue(policy.cooldownMinutes),
  );
  const [saving, setSaving] = useState(false);

  const parseOptionalNumber = (value: string): number | undefined => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handlePatch = async () => {
    setSaving(true);
    try {
      await onPatchCaps(policy.id, {
        dailyCap: parseOptionalNumber(dailyCap),
        weeklyCap: parseOptionalNumber(weeklyCap),
        cooldownMinutes: parseOptionalNumber(cooldownMinutes),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
      <Input
        type="number"
        label={t("xp.dailyCap")}
        value={dailyCap}
        onChange={(event) => setDailyCap(event.target.value)}
      />
      <Input
        type="number"
        label={t("xp.weeklyCap")}
        value={weeklyCap}
        onChange={(event) => setWeeklyCap(event.target.value)}
      />
      <Input
        type="number"
        label={t("xp.cooldownMinutes")}
        value={cooldownMinutes}
        onChange={(event) => setCooldownMinutes(event.target.value)}
      />
      <div className="flex items-end">
        <Button type="button" size="sm" loading={saving} onClick={handlePatch}>
          {t("xp.patchCaps")}
        </Button>
      </div>
    </div>
  );
}

export default function XpPolicyTable({
  policies,
  loading = false,
  canManage = false,
  onPatchCaps,
}: XpPolicyTableProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");

  if (loading && policies.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
        {t("common.loading")}
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        {t("emptyStates.xpPolicies")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {policies.map((policy) => (
        <article
          key={policy.id}
          className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {t(`assignmentScope.${policy.scopeType}`)}
                {policy.scopeId ? ` / ${policy.scopeId}` : ""}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  {policy.isActive ? t("activeState.active") : t("activeState.inactive")}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  {t("xp.dailyCap")}: {policy.dailyCap ?? "-"}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  {t("xp.weeklyCap")}: {policy.weeklyCap ?? "-"}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  {t("xp.cooldownMinutes")}: {policy.cooldownMinutes ?? "-"}
                </span>
              </div>
              {policy.allowedReasons?.length ? (
                <p className="mt-2 text-sm text-gray-500">
                  {t("xp.allowedReasons")}: {policy.allowedReasons.join(", ")}
                </p>
              ) : null}
              {(policy.startsAt || policy.endsAt) && (
                <p className="mt-2 text-xs text-gray-500">
                  {policy.startsAt
                    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                        new Date(policy.startsAt),
                      )
                    : "-"}{" "}
                  -{" "}
                  {policy.endsAt
                    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                        new Date(policy.endsAt),
                      )
                    : "-"}
                </p>
              )}
            </div>
          </div>
          {canManage ? (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <PatchCapsRow policy={policy} onPatchCaps={onPatchCaps} />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
