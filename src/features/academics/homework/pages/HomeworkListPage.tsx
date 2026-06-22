"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Plus, RefreshCcw, Search } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { AccessDenied } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import {
  listHomeworkAssignments,
} from "@/features/academics/homework/services/homeworkService";
import type {
  HomeworkAssignmentUiModel,
  HomeworkAssignmentListFilters,
} from "@/features/academics/homework/services/homeworkApi.types";
import { mapHomeworkApiError } from "@/features/academics/homework/services/homeworkErrors";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import HomeworkLifecycleMenu from "@/features/academics/homework/components/HomeworkLifecycleMenu";
import {
  cancelHomeworkAssignment,
  closeHomeworkAssignment,
  publishHomeworkAssignment,
} from "@/features/academics/homework/services/homeworkService";
import {
  homeworkLifecycle,
  type HomeworkLifecycleAction,
} from "@/features/academics/homework/utils/homeworkLifecycle";

function statusClass(status: HomeworkAssignmentUiModel["status"]) {
  if (status === "published") return "bg-green-100 text-green-700";
  if (status === "closed") return "bg-gray-200 text-gray-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function modeLabelKey(mode: HomeworkAssignmentUiModel["mode"]) {
  if (mode === "writing_task") return "writingTask";
  return mode;
}

export default function HomeworkListPage() {
  const locale = useLocale();
  const t = useTranslations("academics.homework.list");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useToast();
  const { hasPermission } = usePermissions();
  const { academicYearId, termId, termStatus, isInitializing } =
    useAcademicYearTermLayoutContext();
  const canView = hasPermission("homework.assignments.view");
  const canManage = hasPermission("homework.assignments.manage");
  const [items, setItems] = useState<HomeworkAssignmentUiModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("homeworkStatus") || "");
  const [mode, setMode] = useState(searchParams.get("mode") || "");
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [pendingHomeworkId, setPendingHomeworkId] = useState<string | null>(null);
  const [lifecycleConfirmation, setLifecycleConfirmation] = useState<{
    homeworkId: string;
    action: HomeworkLifecycleAction;
  } | null>(null);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("filters.allStatuses") },
      { value: "draft", label: t("statuses.draft") },
      { value: "published", label: t("statuses.published") },
      { value: "closed", label: t("statuses.closed") },
      { value: "cancelled", label: t("statuses.cancelled") },
    ],
    [t],
  );

  const modeOptions = useMemo(
    () => [
      { value: "", label: t("filters.allModes") },
      { value: "homework", label: t("modes.homework") },
      { value: "worksheet", label: t("modes.worksheet") },
      { value: "writing_task", label: t("modes.writingTask") },
      { value: "quiz", label: t("modes.quiz") },
      { value: "reading", label: t("modes.reading") },
      { value: "project", label: t("modes.project") },
    ],
    [t],
  );

  const filters = useMemo<HomeworkAssignmentListFilters>(
    () => ({
      academicYearId: academicYearId || undefined,
      termId: termId || undefined,
      search: search.trim() || undefined,
      status: status || undefined,
      mode: mode || undefined,
      page: Number(searchParams.get("page") || "1"),
      limit: 25,
    }),
    [academicYearId, mode, search, searchParams, status, termId],
  );

  useEffect(() => {
    if (isInitializing || !canView) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await listHomeworkAssignments(filters);
        setItems(response.items);
        setMeta(response.meta);
      } catch (error) {
        showError(t("errors.loadFailed", { code: mapHomeworkApiError(error) }));
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [canView, filters, isInitializing, showError, t]);

  const pushWithFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");
    if (status) params.set("homeworkStatus", status);
    else params.delete("homeworkStatus");
    if (mode) params.set("mode", mode);
    else params.delete("mode");
    params.delete("page");
    router.push(`/${locale}/academics/homework?${params.toString()}`);
  };

  const runLifecycleAction = async () => {
    if (!lifecycleConfirmation) return;
    const { homeworkId, action } = lifecycleConfirmation;
    setPendingHomeworkId(homeworkId);
    try {
      const updated = action === "publish"
        ? await publishHomeworkAssignment(homeworkId)
        : action === "close"
          ? await closeHomeworkAssignment(homeworkId)
          : await cancelHomeworkAssignment(homeworkId);
      setItems((current) => current.map((homework) =>
        homework.id === homeworkId ? updated : homework,
      ));
    } catch (error) {
      showError(t("errors.lifecycleFailed", { code: mapHomeworkApiError(error) }));
    } finally {
      setPendingHomeworkId(null);
      setLifecycleConfirmation(null);
    }
  };

  if (!canView) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <AccessDenied className="max-w-md" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <div className="border-b bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {t("description")}
            </p>
          </div>
          {canManage && (
            <Button
              onClick={() => {
                const params = searchParams.toString();
                router.push(
                  `/${locale}/academics/homework/new${params ? `?${params}` : ""}`,
                );
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              {t("actions.newHomework")}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="rounded-lg border bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Select value={status} onChange={setStatus} options={statusOptions} />
            <Select value={mode} onChange={setMode} options={modeOptions} />
            <Button
              variant="secondary"
              onClick={pushWithFilters}
              leftIcon={<RefreshCcw className="h-4 w-4" />}
            >
              {t("actions.apply")}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <MainLoader />
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              {t("empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">{t("table.title")}</th>
                    <th className="px-4 py-3">{t("table.status")}</th>
                    <th className="px-4 py-3">{t("table.context")}</th>
                    <th className="px-4 py-3">{t("table.due")}</th>
                    <th className="px-4 py-3">{t("table.content")}</th>
                    {canManage && termStatus !== "closed" && (
                      <th className="w-12 px-4 py-3"><span className="sr-only">{t("actions.menu")}</span></th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        const params = searchParams.toString();
                        router.push(
                          `/${locale}/academics/homework/${item.id}${params ? `?${params}` : ""}`,
                        );
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {item.title || t("untitled")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t(`modes.${modeLabelKey(item.mode)}`)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                          {t(`statuses.${item.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{item.classroomName || t("allAssignedTargets")}</div>
                        <div className="text-xs">{item.subjectName || item.teacherName || ""}</div>
                      </td>
                      {canManage && termStatus !== "closed" && (
                        <td
                          className="px-4 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <HomeworkLifecycleMenu
                            actions={homeworkLifecycle(item.status).actions}
                            labels={{
                              menu: t("actions.menu"),
                              publish: t("actions.publish"),
                              close: t("actions.close"),
                              cancel: t("actions.cancel"),
                            }}
                            isPending={pendingHomeworkId === item.id}
                            onAction={(action) => setLifecycleConfirmation({
                              homeworkId: item.id,
                              action,
                            })}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-600">
                        {item.dueAt
                          ? new Date(item.dueAt).toLocaleString(locale)
                          : t("notSet")}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {t("contentSummary", {
                          questions: item.questionCount,
                          attachments: item.attachmentCount,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {t("showing", { shown: items.length, total: meta.total })}
        </div>
      </div>
      <ConfirmDialog
        isOpen={!!lifecycleConfirmation}
        onClose={() => setLifecycleConfirmation(null)}
        onConfirm={() => void runLifecycleAction()}
        title={t("confirm.title")}
        description={t("confirm.description", {
          action: lifecycleConfirmation
            ? t(`actions.${lifecycleConfirmation.action}`)
            : "",
        })}
        confirmLabel={t("confirm.confirm")}
        cancelLabel={t("confirm.back")}
        loading={!!pendingHomeworkId}
        severity={lifecycleConfirmation?.action === "cancel" ? "danger" : "warning"}
      />
    </div>
  );
}
