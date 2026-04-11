"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
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
import {
  buildReinforcementTasksQueryState,
  parseReinforcementTasksQueryState,
} from "../utils/reinforcementQueryState";
import ReinforcementGlobalExportModal from "../shared/components/export/ReinforcementGlobalExportModal";
import { useReinforcementAcademicContext } from "../hooks/useReinforcementAcademicContext";
import {
  exportReinforcementData,
  formatReinforcementExportDate,
  generateReinforcementExportFilename,
  type ExportColumn,
  type ExportMetadata,
  type ReinforcementExportFormat,
} from "../shared/utils/reinforcementExport";

export default function ReinforcementTasksPage() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("reinforcement");
  const tExport = useTranslations("reinforcement.export");
  const { selectedAcademicYear, selectedTerm } =
    useReinforcementAcademicContext();
  const [tasks, setTasks] = useState<ReinforcementTask[]>([]);
  const filters = useMemo(
    () =>
      parseReinforcementTasksQueryState(
        new URLSearchParams(searchParams.toString()),
      ),
    [searchParams],
  );
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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

  const formatDate = useCallback(
    (value?: string) => {
      if (!value) return "";
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(value),
      );
    },
    [locale],
  );

  const formatDateTime = useCallback(
    (value?: string) => {
      if (!value) return "";
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    },
    [locale],
  );

  const taskExportRows = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        title: locale === "ar" ? task.titleAr : task.titleEn,
        alternateTitle: locale === "ar" ? task.titleEn : task.titleAr,
        assignmentScope: t(`assignmentScope.${task.primaryTargetType}`),
        audience: locale === "ar" ? task.targetSummaryAr : task.targetSummaryEn,
        audienceCount: task.audienceCount,
        source: t(`source.${task.source}`),
        status: t(`status.${task.status}`),
        rewardType: t(`rewardType.${task.rewardType}`),
        rewardValue: task.rewardValue,
        dueDate: formatDate(task.dueDate),
        assignedBy: task.assignedByName || "",
        stageCount: task.stages.length,
        completedStageCount: task.stages.filter((stage) => stage.isCompleted).length,
        createdAt: formatDateTime(task.createdAt),
        updatedAt: formatDateTime(task.updatedAt),
      })),
    [formatDate, formatDateTime, locale, t, tasks],
  );

  const taskExportColumns = useMemo<ExportColumn[]>(
    () => [
      { key: "id", label: locale === "ar" ? "رقم المهمة" : "Task ID" },
      { key: "title", label: locale === "ar" ? "المهمة" : "Task" },
      {
        key: "alternateTitle",
        label: locale === "ar" ? "العنوان باللغة الأخرى" : "Alternate title",
      },
      {
        key: "assignmentScope",
        label: locale === "ar" ? "مستوى التعيين" : "Assignment scope",
      },
      { key: "audience", label: t("table.audience") },
      {
        key: "audienceCount",
        label: locale === "ar" ? "عدد الجمهور" : "Audience count",
      },
      { key: "source", label: t("table.source") },
      { key: "status", label: t("table.status") },
      { key: "rewardType", label: locale === "ar" ? "نوع المكافأة" : "Reward type" },
      { key: "rewardValue", label: locale === "ar" ? "قيمة المكافأة" : "Reward value" },
      { key: "dueDate", label: t("table.dueDate") },
      { key: "assignedBy", label: locale === "ar" ? "تم الإسناد بواسطة" : "Assigned by" },
      { key: "stageCount", label: locale === "ar" ? "عدد المراحل" : "Stage count" },
      {
        key: "completedStageCount",
        label: locale === "ar" ? "المراحل المكتملة" : "Completed stages",
      },
      { key: "createdAt", label: locale === "ar" ? "تاريخ الإنشاء" : "Created at" },
      { key: "updatedAt", label: locale === "ar" ? "آخر تحديث" : "Updated at" },
    ],
    [locale, t],
  );

  const taskJsonExportData = useMemo(
    () => ({
      title: "Reinforcement Tasks",
      metadata: {
        yearName: selectedAcademicYear?.name || null,
        termName: selectedTerm?.name || null,
        exportDate: formatReinforcementExportDate("en"),
      },
      filters: {
        search: filters.search || null,
        assignmentScope:
          filters.assignmentScope && filters.assignmentScope !== "all"
            ? filters.assignmentScope
            : null,
        targetId: filters.targetId || null,
        source: filters.source && filters.source !== "all" ? filters.source : null,
        status: filters.status && filters.status !== "all" ? filters.status : null,
        rewardType:
          filters.rewardType && filters.rewardType !== "all"
            ? filters.rewardType
            : null,
        dueDate: filters.dueDate || null,
      },
      tasks: tasks.map((task) => ({
        id: task.id,
        titleEn: task.titleEn,
        titleAr: task.titleAr,
        descriptionEn: task.descriptionEn || null,
        descriptionAr: task.descriptionAr || null,
        primaryTargetType: task.primaryTargetType,
        primaryTargetId: task.primaryTargetId,
        targetSummaryEn: task.targetSummaryEn,
        targetSummaryAr: task.targetSummaryAr,
        audienceCount: task.audienceCount,
        source: task.source,
        status: task.status,
        rewardType: task.rewardType,
        rewardValue: task.rewardValue,
        dueDate: task.dueDate || null,
        assignedById: task.assignedById || null,
        assignedByName: task.assignedByName || null,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        targets: task.targets.map((target) => ({
          scopeType: target.scopeType,
          scopeId: target.scopeId,
          nameEn: target.nameEn,
          nameAr: target.nameAr,
          audienceCount: target.audienceCount ?? null,
          stageId: target.stageId || null,
          stageNameEn: target.stageNameEn || null,
          stageNameAr: target.stageNameAr || null,
          gradeId: target.gradeId || null,
          gradeNameEn: target.gradeNameEn || null,
          gradeNameAr: target.gradeNameAr || null,
          sectionId: target.sectionId || null,
          sectionNameEn: target.sectionNameEn || null,
          sectionNameAr: target.sectionNameAr || null,
          classroomId: target.classroomId || null,
          classroomNameEn: target.classroomNameEn || null,
          classroomNameAr: target.classroomNameAr || null,
        })),
        stages: task.stages.map((stage) => ({
          id: stage.id,
          titleEn: stage.titleEn,
          titleAr: stage.titleAr,
          descriptionEn: stage.descriptionEn || null,
          descriptionAr: stage.descriptionAr || null,
          proofType: stage.proofType,
          isCompleted: stage.isCompleted,
          isApproved: stage.isApproved,
          submittedAt: stage.submittedAt || null,
          proofUrl: stage.proofUrl || null,
        })),
      })),
    }),
    [
      filters.assignmentScope,
      filters.dueDate,
      filters.rewardType,
      filters.search,
      filters.source,
      filters.status,
      filters.targetId,
      selectedAcademicYear?.name,
      selectedTerm?.name,
      tasks,
    ],
  );

  const handleExport = async (format: ReinforcementExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: selectedAcademicYear?.name || undefined,
      termName: selectedTerm?.name || undefined,
      viewName: t("tasks"),
      exportDate: formatReinforcementExportDate(locale),
    };

    exportReinforcementData({
      title: t("tasks"),
      metadata,
      filename: generateReinforcementExportFilename(
        "reinforcement-tasks",
        selectedTerm?.id,
      ),
      format,
      columns: taskExportColumns,
      rows: taskExportRows,
      jsonData: taskJsonExportData,
      locale,
      emptyMessage: tExport("errors.noData"),
    });
  };

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
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => setIsExportModalOpen(true)}
            >
              {tExport("button")}
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

      <ReinforcementGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("tasksDescription")}
        datasetCount={tasks.length}
        emptyStateMessage={tExport("errors.noData")}
      />
    </div>
  );
}
