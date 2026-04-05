"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import {
  fetchNedaaSettings,
  saveNedaaSettings,
} from "@/features/nedaa/services/nedaaService";
import type { NedaaGateId, NedaaSettings } from "@/features/nedaa/types/nedaa";
import NedaaSettingsView from "@/features/nedaa/views/NedaaSettingsView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";

export default function NedaaSettingsPage() {
  const t = useTranslations("nedaa");
  const { showSuccess, showError } = useToast();
  const { isLoading: isContextLoading, error, isReadOnly } =
    useStudentsGuardiansYearTermContext();
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<NedaaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const nextSettings = await fetchNedaaSettings();
        if (!cancelled) {
          setSettings(nextSettings);
          setInitialSettings(nextSettings);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_settings_failed"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleSave = async () => {
    if (!settings) {
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveNedaaSettings(settings);
      setSettings(saved);
      setInitialSettings(saved);
      showSuccess(t("messages.settings_saved"));
    } catch {
      showError(t("messages.settings_save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (error || loadError || !settings || !initialSettings) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {error || loadError || t("messages.load_settings_failed")}
        </p>
      </div>
    );
  }

  return (
    <NedaaSettingsView
      settings={settings}
      initialSettings={initialSettings}
      isSaving={isSaving}
      isReadOnly={isReadOnly}
      onChange={(updates) =>
        setSettings((current) => (current ? { ...current, ...updates } : current))
      }
      onToggleGate={(gate: NedaaGateId) =>
        setSettings((current) => {
          if (!current) {
            return current;
          }

          const activeGates = current.activeGates.includes(gate)
            ? current.activeGates.filter((value) => value !== gate)
            : [...current.activeGates, gate];

          return { ...current, activeGates };
        })
      }
      onReset={() => setSettings(initialSettings)}
      onSave={handleSave}
    />
  );
}
