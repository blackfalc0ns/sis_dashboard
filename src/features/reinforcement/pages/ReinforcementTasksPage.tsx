"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementTasksFilters from "../components/filters/ReinforcementTasksFilters";
import ReinforcementTasksTable from "../components/tables/ReinforcementTasksTable";
import ReinforcementTaskModal from "../components/modals/ReinforcementTaskModal";
import type {
  ReinforcementAssignmentScope,
  ReinforcementScopeOption,
  ReinforcementTask,
  ReinforcementTaskFilters,
} from "../types/reinforcement";
import {
  cancelTask,
  createReinforcementTask,
  duplicateTask,
  getReinforcementFilterOptions,
  getReinforcementTasks,
} from "../services/reinforcementService";
import { downloadCsv } from "../libs/reinforcementCsv";
import {
  buildReinforcementTasksQueryState,
  parseReinforcementTasksQueryState,
} from "../utils/reinforcementQueryState";

export default function ReinforcementTasksPage() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("reinforcement");
  const [tasks, setTasks] = useState<ReinforcementTask[]>([]);
  const filters = useMemo(
    () =>
      parseReinforcementTasksQueryState(
        new URLSearchParams(searchParams.toString()),
      ),
    [searchParams],
  );
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [scopeTargets, setScopeTargets] = useState<
    Record<ReinforcementAssignmentScope, ReinforcementScopeOption[]>
  >({
    school: [],
    stage: [],
    grade: [],
    section: [],
    classroom: [],
    student: [],
  });

  const refreshTasks = useCallback(
    () => getReinforcementTasks(filters).then(setTasks),
    [filters],
  );

  useEffect(() => {
    getReinforcementFilterOptions().then((options) => {
      setScopeTargets(options.scopeTargets);
    });
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const replaceFilters = useCallback(
    (next: ReinforcementTaskFilters) => {
      const normalized =
        next.assignmentScope && next.assignmentScope !== "all"
          ? next
          : { ...next, targetId: undefined };
      const nextQuery = buildReinforcementTasksQueryState(
        normalized,
        new URLSearchParams(searchParams.toString()),
      );
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const exportRows = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        task: locale === "ar" ? task.titleAr : task.titleEn,
        assignmentLevel: task.primaryTargetType,
        audience: locale === "ar" ? task.targetSummaryAr : task.targetSummaryEn,
        audienceCount: task.audienceCount,
        source: task.source,
        status: task.status,
        rewardType: task.rewardType,
        dueDate: task.dueDate || "",
      })),
    [locale, tasks],
  );

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <ReinforcementPageHeader
        title={t("tasks")}
        description={t("tasksDescription")}
        actions={
          <>
            <Button onClick={() => setIsTaskModalOpen(true)}>
              {t("actions.newTask")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadCsv("reinforcement-tasks.csv", exportRows)}
            >
              {t("actions.exportCsv")}
            </Button>
          </>
        }
      />

      <ReinforcementTasksFilters
        filters={filters}
        onChange={replaceFilters}
        scopeTargets={scopeTargets}
      />

      <ReinforcementTasksTable
        tasks={tasks}
        searchQuery={filters.search}
        onRowClick={(task) => router.push(`/${locale}/reinforcement/tasks/${task.id}`)}
        onDuplicate={async (task) => {
          await duplicateTask(task.id);
          refreshTasks();
        }}
        onCancel={async (task) => {
          await cancelTask(task.id);
          refreshTasks();
        }}
      />

      <ReinforcementTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        scopeTargets={scopeTargets}
        onSave={async (payload) => {
          await createReinforcementTask(payload);
          await refreshTasks();
        }}
      />
    </div>
  );
}
