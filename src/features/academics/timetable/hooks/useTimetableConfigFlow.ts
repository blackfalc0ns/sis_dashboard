"use client";

import { useCallback, useState } from "react";
import { upsertTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import {
  mapEntriesToNewConfig,
  type ResolvedTimetableConfig,
  type TimetableConfigScope,
  type TimetableDay,
  type TimetablePeriod,
} from "@/features/academics/timetable/types/timetableConfig";
import { type TimetableEntry } from "@/features/academics/timetable/types/timetable";

interface ConfigPayload {
  scopeType: TimetableConfigScope;
  scopeId?: string;
  days: TimetableDay[];
  periods: TimetablePeriod[];
}

interface UseTimetableConfigFlowParams {
  termId: string;
  timetableEntries: TimetableEntry[];
  setTimetableEntries: React.Dispatch<React.SetStateAction<TimetableEntry[]>>;
  reloadConfigs: () => Promise<unknown>;
  markDirty: () => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export function useTimetableConfigFlow({
  termId,
  timetableEntries,
  setTimetableEntries,
  reloadConfigs,
  markDirty,
  showSuccess,
  showError,
}: UseTimetableConfigFlowParams) {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configWarningOpen, setConfigWarningOpen] = useState(false);
  const [pendingConfigData, setPendingConfigData] = useState<ConfigPayload | null>(null);
  const [migrationResult, setMigrationResult] = useState<{ kept: number; dropped: number } | null>(null);

  const applyConfigChange = useCallback(
    async (config: ConfigPayload, resolved: ResolvedTimetableConfig) => {
      try {
        await upsertTimetableConfig({
          termId,
          scopeType: config.scopeType,
          scopeId: config.scopeId,
          days: config.days,
          periods: config.periods,
        });

        await reloadConfigs();

        const migration = mapEntriesToNewConfig(timetableEntries, resolved);
        setTimetableEntries(migration.kept);
        markDirty();
        setConfigDialogOpen(false);
        showSuccess("config.resetSuccess");
        return true;
      } catch (error) {
        console.error("Failed to save config:", error);
        showError("config.validation.saveFailed");
        return false;
      }
    },
    [
      markDirty,
      reloadConfigs,
      setTimetableEntries,
      showError,
      showSuccess,
      termId,
      timetableEntries,
    ]
  );

  const handleConfigSave = useCallback(
    async (newConfig: ConfigPayload) => {
      const newResolved: ResolvedTimetableConfig = {
        days: newConfig.days,
        periods: newConfig.periods,
        source: { scope: newConfig.scopeType, id: newConfig.scopeId },
      };

      const migration = mapEntriesToNewConfig(timetableEntries, newResolved);
      if (migration.dropped.length > 0) {
        setPendingConfigData(newConfig);
        setMigrationResult({
          kept: migration.kept.length,
          dropped: migration.dropped.length,
        });
        setConfigWarningOpen(true);
        return;
      }

      await applyConfigChange(newConfig, newResolved);
    },
    [applyConfigChange, timetableEntries]
  );

  const confirmConfigWarning = useCallback(async () => {
    if (!pendingConfigData) {
      return;
    }

    const newResolved: ResolvedTimetableConfig = {
      days: pendingConfigData.days,
      periods: pendingConfigData.periods,
      source: {
        scope: pendingConfigData.scopeType,
        id: pendingConfigData.scopeId,
      },
    };

    const applied = await applyConfigChange(pendingConfigData, newResolved);
    if (applied) {
      setConfigWarningOpen(false);
      setPendingConfigData(null);
      setMigrationResult(null);
    }
  }, [applyConfigChange, pendingConfigData]);

  const closeConfigWarning = useCallback(() => {
    setConfigWarningOpen(false);
    setPendingConfigData(null);
    setMigrationResult(null);
  }, []);

  return {
    configDialogOpen,
    setConfigDialogOpen,
    configWarningOpen,
    pendingConfigData,
    migrationResult,
    handleConfigSave,
    confirmConfigWarning,
    closeConfigWarning,
  };
}
