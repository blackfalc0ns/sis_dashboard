"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementTaskCancelModal from "../components/ReinforcementTaskCancelModal";
import ReinforcementTaskDuplicateModal from "../components/ReinforcementTaskDuplicateModal";
import {
  cancelReinforcementTask,
  duplicateReinforcementTask,
  getReinforcementTask,
} from "../services/reinforcementTasksService";
import type {
  CancelReinforcementTaskPayload,
  DuplicateReinforcementTaskPayload,
  ReinforcementTask,
} from "../types";

interface ReinforcementTaskDetailPageProps {
  taskId: string;
}

const statusLabels: Record<string, { en: string; ar: string }> = {
  cancel: { en: "Cancelled", ar: "ملغي" },
  completed: { en: "Completed", ar: "مكتمل" },
  in_progress: { en: "In progress", ar: "قيد التنفيذ" },
  not_completed: { en: "Not completed", ar: "غير مكتمل" },
};

const labelFor = (key: string): string =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const valueFor = (value: unknown): string => {
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "-";
};

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

export default function ReinforcementTaskDetailPage({
  taskId,
}: ReinforcementTaskDetailPageProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const [task, setTask] = useState<ReinforcementTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const canView = hasPermission("reinforcement.tasks.view");
  const canManage = hasPermission("reinforcement.tasks.manage");

  const refreshTask = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      setTask(await getReinforcementTask(taskId));
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, showError, t, taskId]);

  useEffect(() => {
    void Promise.resolve().then(refreshTask);
  }, [refreshTask]);

  const handleDuplicate = async (
    payload: DuplicateReinforcementTaskPayload,
  ) => {
    if (!task) return;
    try {
      await duplicateReinforcementTask(task.id, payload);
      showSuccess(t("tasks.messages.duplicated"));
      setDuplicateOpen(false);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  const handleCancel = async (payload: CancelReinforcementTaskPayload) => {
    if (!task || task.status === "cancel") return;
    try {
      const nextTask = await cancelReinforcementTask(task.id, payload);
      setTask(nextTask);
      showSuccess(t("tasks.messages.cancelled"));
      setCancelOpen(false);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  const title = task
    ? locale === "ar"
      ? task.titleAr || task.titleEn || task.id
      : task.titleEn || task.titleAr || task.id
    : t("tasks.detailTitle");
  const isCancelled = task?.status === "cancel";

  return (
    <div className="min-h-screen space-y-6 bg-gray-50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ReinforcementPageHeader
        title={title}
        description={t("tasks.detailDescription")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshTask}
            >
              {t("actions.refresh")}
            </Button>
            {canManage && task ? (
              <Button variant="secondary" onClick={() => setDuplicateOpen(true)}>
                {t("actions.duplicate")}
              </Button>
            ) : null}
            {canManage && task && !isCancelled ? (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                {t("tasks.confirmCancel")}
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      {loading && !task ? (
        <MainLoader />
      ) : task ? (
        <>
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("tasks.summary")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["status", statusLabels[String(task.status)]?.[locale === "ar" ? "ar" : "en"] || task.status],
                ["source", t(`source.${task.source}`)],
                ["rewardType", t(`rewardType.${task.rewardType}`)],
                ["dueDate", task.dueDate],
              ].map(([key, value]) => (
                <div key={key} className="rounded-lg bg-gray-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t(`tasks.detailFields.${key}`)}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {String(value || "-")}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {task.assignmentSummary ? (
            <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                {t("tasks.assignmentSummary")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {Object.entries(task.assignmentSummary).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-gray-50 px-3 py-3">
                    <div className="text-xs font-medium uppercase text-gray-500">
                      {labelFor(key)}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {valueFor(value)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("tasks.form.targets")}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(task.targets || []).length === 0 ? (
                <span className="text-sm text-gray-500">{t("common.empty")}</span>
              ) : (
                (task.targets || []).map((target) => (
                  <span
                    key={`${target.scopeType}:${target.scopeId}`}
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {target.nameEn || target.nameAr || target.scopeId}
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("tasks.form.stages")}
            </h2>
            <div className="mt-4 space-y-3">
              {(task.stages || []).map((stage, index) => (
                <div
                  key={stage.id || index}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="font-semibold text-gray-900">
                    {locale === "ar"
                      ? stage.titleAr || stage.titleEn
                      : stage.titleEn || stage.titleAr}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {t(`proofType.${stage.proofType}`)}
                    {stage.requiresApproval ? ` / ${t("tasks.form.requiresApproval")}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
          {t("emptyStates.tasks")}
        </div>
      )}

      <ReinforcementTaskDuplicateModal
        task={task}
        isOpen={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        onSubmit={handleDuplicate}
      />
      <ReinforcementTaskCancelModal
        task={task}
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={handleCancel}
      />
    </div>
  );
}
