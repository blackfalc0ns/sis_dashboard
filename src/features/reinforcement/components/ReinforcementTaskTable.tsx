"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import type { ReinforcementTask } from "../types";

interface ReinforcementTaskTableProps {
  tasks: ReinforcementTask[];
  loading?: boolean;
  canManage?: boolean;
  onDuplicate: (task: ReinforcementTask) => void;
  onCancel: (task: ReinforcementTask) => void;
}

const taskTitle = (task: ReinforcementTask, locale: string) =>
  locale === "ar"
    ? task.titleAr || task.titleEn || task.id
    : task.titleEn || task.titleAr || task.id;

const statusLabels: Record<string, { en: string; ar: string }> = {
  cancelled: { en: "Cancelled", ar: "ملغي" },
  completed: { en: "Completed", ar: "مكتمل" },
  in_progress: { en: "In progress", ar: "قيد التنفيذ" },
  not_completed: { en: "Not completed", ar: "غير مكتمل" },
};

const statusLabel = (status: unknown, locale: string) => {
  const value = typeof status === "string" ? status : "";
  return statusLabels[value]?.[locale === "ar" ? "ar" : "en"] || value || "-";
};

const rewardLabel = (task: ReinforcementTask, t: (key: string) => string) =>
  `${t(`rewardType.${task.rewardType}`)}${task.rewardValue ? ` / ${task.rewardValue}` : ""}`;

export default function ReinforcementTaskTable({
  tasks,
  loading = false,
  canManage = false,
  onDuplicate,
  onCancel,
}: ReinforcementTaskTableProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");

  if (loading && tasks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
        {t("common.loading")}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
        <ClipboardList className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-3 text-sm font-medium text-gray-900">
          {t("emptyStates.tasks")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {[
                "task",
                "source",
                "status",
                "reward",
                "dueDate",
                "actions",
              ].map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500"
                >
                  {t(`tasks.table.${key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map((task) => {
              const isCancelled = task.status === "cancelled";
              return (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="max-w-sm px-4 py-4">
                    <div className="font-semibold text-gray-900">
                      {taskTitle(task, locale)}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {locale === "ar"
                        ? task.descriptionAr || task.descriptionEn
                        : task.descriptionEn || task.descriptionAr}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {t(`source.${task.source}`)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {statusLabel(task.status, locale)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {rewardLabel(task, t)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {task.dueDate
                      ? new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                        }).format(new Date(task.dueDate))
                      : "-"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/${locale}/reinforcement/tasks/${task.id}`}>
                        <Button type="button" variant="secondary" size="sm">
                          {t("tasks.table.view")}
                        </Button>
                      </Link>
                      {canManage ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onDuplicate(task)}
                        >
                          {t("actions.duplicate")}
                        </Button>
                      ) : null}
                      {canManage && !isCancelled ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => onCancel(task)}
                        >
                          {t("actions.cancel")}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
