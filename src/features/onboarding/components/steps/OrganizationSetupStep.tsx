"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import { timezones } from "@/features/settings/constants/defaults";
import { updateBrandingProfile } from "@/features/settings/services/brandingService";
import type { SchoolProfileSettings } from "@/features/settings/types";

export interface OrganizationSetupStepCopy {
  summary: string;
  schoolName: string;
  shortName: string;
  timezone: string;
  addressLine: string;
  city: string;
  country: string;
  save: string;
  saving: string;
  required: string;
  saveFailed: string;
}

interface OrganizationSetupStepProps {
  copy: OrganizationSetupStepCopy;
  profile: SchoolProfileSettings | null;
  refreshStep(stepId: "organization"): Promise<void> | void;
}

export function OrganizationSetupStep({ copy, profile, refreshStep }: OrganizationSetupStepProps) {
  const [draft, setDraft] = useState<SchoolProfileSettings | null>(profile);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(profile);
    setError("");
  }, [profile]);

  if (!draft) {
    return <p className="text-sm text-gray-600">{copy.summary}</p>;
  }

  const updateField = (key: keyof SchoolProfileSettings, value: string) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setError("");
  };

  const handleSave = async () => {
    if (!draft.schoolName.trim()) {
      setError(copy.required);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await updateBrandingProfile(draft);
      await refreshStep("organization");
    } catch {
      setError(copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{copy.summary}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label={copy.schoolName}
          onChange={(event) => updateField("schoolName", event.target.value)}
          required
          value={draft.schoolName}
        />
        <Input
          label={copy.shortName}
          onChange={(event) => updateField("shortName", event.target.value)}
          value={draft.shortName}
        />
        <Select
          label={copy.timezone}
          onChange={(value) => updateField("timezone", value)}
          options={timezones.map((timezone) => ({ value: timezone, label: timezone }))}
          value={draft.timezone}
        />
        <Input
          label={copy.city}
          onChange={(event) => updateField("city", event.target.value)}
          value={draft.city}
        />
        <Input
          label={copy.country}
          onChange={(event) => updateField("country", event.target.value)}
          value={draft.country}
        />
        <Input
          label={copy.addressLine}
          onChange={(event) => updateField("addressLine", event.target.value)}
          value={draft.addressLine}
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button loading={isSaving} onClick={() => void handleSave()} type="button">
        {isSaving ? copy.saving : copy.save}
      </Button>
    </div>
  );
}
