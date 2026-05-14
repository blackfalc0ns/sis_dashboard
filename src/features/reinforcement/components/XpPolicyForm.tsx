"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import type {
  CreateXpPolicyPayload,
  ReinforcementTargetScope,
  XpPolicyScopeType,
} from "../types";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "./ReinforcementAcademicContextFilter";
import ReinforcementTaskTargetSelector, {
  type ReinforcementTaskTargetSelection,
} from "./ReinforcementTaskTargetSelector";

interface XpPolicyFormProps {
  onSubmit: (payload: CreateXpPolicyPayload) => Promise<void>;
  onCancel: () => void;
}

const parseOptionalNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const reasonsFromText = (value: string): string[] | undefined => {
  const reasons = value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return reasons.length ? reasons : undefined;
};

export default function XpPolicyForm({ onSubmit, onCancel }: XpPolicyFormProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const [context, setContext] = useState<ReinforcementAcademicContextValue>({});
  const [targets, setTargets] = useState<ReinforcementTaskTargetSelection[]>([]);
  const [dailyCap, setDailyCap] = useState("");
  const [weeklyCap, setWeeklyCap] = useState("");
  const [cooldownMinutes, setCooldownMinutes] = useState("");
  const [allowedReasons, setAllowedReasons] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const selectedTarget = targets[0];
    if (!context.academicYearId || !context.termId) {
      setError(t("validation.required"));
      return;
    }
    if (!selectedTarget) {
      setError(t("validation.targetRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        academicYearId: context.academicYearId,
        termId: context.termId,
        scopeType: selectedTarget.scopeType as XpPolicyScopeType,
        scopeId: selectedTarget.scopeId,
        dailyCap: parseOptionalNumber(dailyCap),
        weeklyCap: parseOptionalNumber(weeklyCap),
        cooldownMinutes: parseOptionalNumber(cooldownMinutes),
        allowedReasons: reasonsFromText(allowedReasons),
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <ReinforcementAcademicContextFilter
        value={context}
        showSubject={false}
        showStudent={false}
        onChange={(selection: ReinforcementAcademicContextSelection) =>
          setContext({
            academicYearId: selection.academicYearId,
            termId: selection.termId,
          })
        }
      />

      <section className="rounded-lg border border-gray-100 bg-white p-4">
        <h3 className="text-base font-semibold text-gray-900">
          {t("xp.policyScope")}
        </h3>
        <div className="mt-4">
          <ReinforcementTaskTargetSelector
            academicYearId={context.academicYearId}
            termId={context.termId}
            defaultScope={"student" as ReinforcementTargetScope}
            value={targets}
            onChange={(nextTargets) => setTargets(nextTargets.slice(-1))}
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-4">
        <h3 className="text-base font-semibold text-gray-900">
          {t("xp.policyCaps")}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
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
          <Input
            type="date"
            label={t("xp.startsAt")}
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          <Input
            type="date"
            label={t("xp.endsAt")}
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
          <label className="flex min-h-[70px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>{t("xp.isActive")}</span>
          </label>
        </div>
        <div className="mt-4">
          <TextArea
            label={t("xp.allowedReasons")}
            helperText={t("xp.allowedReasonsHelp")}
            value={allowedReasons}
            onChange={(event) => setAllowedReasons(event.target.value)}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("actions.cancel")}
        </Button>
        <Button type="button" loading={saving} onClick={handleSubmit}>
          {t("actions.create")}
        </Button>
      </div>
    </div>
  );
}
