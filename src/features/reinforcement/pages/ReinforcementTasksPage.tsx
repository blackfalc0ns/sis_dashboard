"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus, RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "../components/ReinforcementAcademicContextFilter";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementTaskCancelModal from "../components/ReinforcementTaskCancelModal";
import ReinforcementTaskDuplicateModal from "../components/ReinforcementTaskDuplicateModal";
import ReinforcementTaskTable from "../components/ReinforcementTaskTable";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import {
  cancelReinforcementTask,
  duplicateReinforcementTask,
  listReinforcementTasks,
} from "../services/reinforcementTasksService";
import type {
  CancelReinforcementTaskPayload,
  DuplicateReinforcementTaskPayload,
  ReinforcementTask,
  ReinforcementTaskStatus,
} from "../types";

function AccessNotice() {
  const t = useTranslations("reinforcement.common");
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReinforcementTasksPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const [context, setContext] = useState<ReinforcementAcademicContextValue>({});
  const [status, setStatus] = useState<ReinforcementTaskStatus | "">("");
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [tasks, setTasks] = useState<ReinforcementTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicateTask, setDuplicateTask] = useState<ReinforcementTask | null>(
    null,
  );
  const [cancelTask, setCancelTask] = useState<ReinforcementTask | null>(null);

  const canView = hasPermission("reinforcement.tasks.view");
  const canManage = hasPermission("reinforcement.tasks.manage");

  const params = useMemo(
    () => ({
      academicYearId: context.academicYearId,
      termId: context.termId,
      // includeCancelled,
      // limit: 50,
    }),
    [
      context.academicYearId,
      context.termId,
    ],
  );

  const refreshTasks = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      await getReinforcementFilterOptions(params);
      const response = await listReinforcementTasks(params);
      setTasks(response.items);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      setTasks([]);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, params, showError, t]);

  useEffect(() => {
    void Promise.resolve().then(refreshTasks);
  }, [refreshTasks]);

  const handleDuplicate = async (
    payload: DuplicateReinforcementTaskPayload,
  ) => {
    if (!duplicateTask) return;
    try {
      await duplicateReinforcementTask(duplicateTask.id, payload);
      showSuccess(t("tasks.messages.duplicated"));
      setDuplicateTask(null);
      await refreshTasks();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  const handleCancel = async (payload: CancelReinforcementTaskPayload) => {
    if (!cancelTask || cancelTask.status === "cancelled") return;
    try {
      await cancelReinforcementTask(cancelTask.id, payload);
      showSuccess(t("tasks.messages.cancelled"));
      setCancelTask(null);
      await refreshTasks();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div
      className="min-h-screen space-y-6 bg-gray-50"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <ReinforcementPageHeader
        title={t("tasks.title")}
        description={t("tasks.description")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshTasks}
            >
              {t("actions.refresh")}
            </Button>
            {canManage ? (
              <Link href={`/${locale}/reinforcement/tasks/new`}>
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  {t("actions.newTask")}
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("tasks.filters")}
        </h2>
        <div className="mt-4">
          <ReinforcementAcademicContextFilter
            value={context}
            showSubject
            showStudent
            onChange={(selection: ReinforcementAcademicContextSelection) =>
              setContext({
                academicYearId: selection.academicYearId,
                termId: selection.termId,
                stageId: selection.stageId,
                gradeId: selection.gradeId,
                sectionId: selection.sectionId,
                classroomId: selection.classroomId,
                subjectId: selection.subjectId,
                studentId: selection.studentId,
                enrollmentId: selection.enrollmentId,
              })
            }
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label={t("tasks.table.status")}
            value={status}
            onChange={(value) =>
              setStatus(value as ReinforcementTaskStatus | "")
            }
            options={[
              { value: "", label: t("filters.allStatuses") },
              { value: "not_completed", label: t("status.not_completed") },
              { value: "in_progress", label: t("status.in_progress") },
              { value: "completed", label: t("status.completed") },
              { value: "cancelled", label: t("status.cancelled") },
            ]}
          />
          <label className="flex min-h-[70px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeCancelled}
              onChange={(event) => setIncludeCancelled(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>{t("tasks.includeCancelled")}</span>
          </label>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      <ReinforcementTaskTable
        tasks={tasks}
        loading={loading}
        canManage={canManage}
        onDuplicate={setDuplicateTask}
        onCancel={setCancelTask}
      />

      <ReinforcementTaskDuplicateModal
        task={duplicateTask}
        isOpen={Boolean(duplicateTask)}
        onClose={() => setDuplicateTask(null)}
        onSubmit={handleDuplicate}
      />
      <ReinforcementTaskCancelModal
        task={cancelTask}
        isOpen={Boolean(cancelTask)}
        onClose={() => setCancelTask(null)}
        onSubmit={handleCancel}
      />
    </div>
  );
}
