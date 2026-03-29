"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import ReinforcementBadge from "../components/shared/ReinforcementBadge";
import type { ReinforcementTask } from "../types/reinforcement";
import {
  approveTask,
  getReinforcementTaskById,
  rejectTask,
  requestResubmission,
} from "../services/reinforcementService";
import { useReinforcementLocale } from "../hooks/useReinforcementLocale";

interface ReinforcementTaskDetailsPageProps {
  taskId: string;
}

export default function ReinforcementTaskDetailsPage({
  taskId,
}: ReinforcementTaskDetailsPageProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("reinforcement.details");
  const { getLocalizedText } = useReinforcementLocale();
  const [task, setTask] = useState<ReinforcementTask | null>(null);

  useEffect(() => {
    getReinforcementTaskById(taskId).then(setTask);
  }, [taskId]);

  const timelineItems = useMemo(() => {
    if (!task) return [];

    return [
      {
        id: "created",
        label: t("timeline.created"),
        value: task.createdAt,
      },
      {
        id: "updated",
        label: t("timeline.updated"),
        value: task.updatedAt,
      },
      ...task.stages
        .filter((stage) => stage.submittedAt)
        .map((stage) => ({
          id: stage.id,
          label: getLocalizedText(stage.titleAr, stage.titleEn),
          value: stage.submittedAt || "",
        })),
    ];
  }, [getLocalizedText, t, task]);

  if (!task) {
    return <div className="rounded-xl bg-white p-6 shadow-sm">{t("notFound")}</div>;
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <button
          onClick={() => router.push(`/${locale}/reinforcement/tasks`)}
          className="mb-4 text-sm font-medium text-gray-500 hover:text-primary"
        >
          {t("back")}
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getLocalizedText(task.titleAr, task.titleEn)}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>{task.studentName}</span>
              <span>•</span>
              <span>{task.className}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ReinforcementBadge type="status" value={task.status} />
              <ReinforcementBadge type="source" value={task.source} />
              <ReinforcementBadge type="rewardType" value={task.rewardType} />
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">{t("rewardSection")}</div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {task.rewardValue}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {t("assignedBy")}: {task.assignedByName || "-"}
            </div>
            <div className="text-sm text-gray-500">
              {t("dueDate")}: {task.dueDate || "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <div className="space-y-6">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{t("description")}</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {getLocalizedText(task.descriptionAr || "", task.descriptionEn || "")}
            </p>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{t("stages")}</h2>
            <div className="mt-4 space-y-3">
              {task.stages.map((stage, index) => (
                <div key={stage.id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {index + 1}. {getLocalizedText(stage.titleAr, stage.titleEn)}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {getLocalizedText(stage.descriptionAr || "", stage.descriptionEn || "")}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ReinforcementBadge type="proofType" value={stage.proofType} />
                      <ReinforcementBadge
                        type="active"
                        value={stage.isApproved ? "active" : "inactive"}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>
                      {t("stageStatus.completed")}: {stage.isCompleted ? t("yes") : t("no")}
                    </span>
                    <span>
                      {t("stageStatus.approved")}: {stage.isApproved ? t("yes") : t("no")}
                    </span>
                    <span>
                      {t("stageStatus.submittedAt")}: {stage.submittedAt || "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{t("attachments")}</h2>
            <div className="mt-4 space-y-3">
              {task.stages.filter((stage) => stage.proofUrl).length > 0 ? (
                task.stages
                  .filter((stage) => stage.proofUrl)
                  .map((stage) => (
                    <div key={stage.id} className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">
                        {getLocalizedText(stage.titleAr, stage.titleEn)}
                      </div>
                      <div className="mt-1">{stage.proofUrl}</div>
                    </div>
                  ))
              ) : (
                <div className="rounded-lg bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  {t("noAttachments")}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{t("timeline.title")}</h2>
            <div className="mt-4 space-y-3">
              {timelineItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{t("reviewActions")}</h2>
            <div className="mt-4 grid gap-3">
              <Button
                variant="success"
                onClick={async () => setTask(await approveTask(task.id))}
              >
                {t("approve")}
              </Button>
              <Button
                variant="danger"
                onClick={async () => setTask(await rejectTask(task.id))}
              >
                {t("reject")}
              </Button>
              <Button
                variant="secondary"
                onClick={async () => setTask(await requestResubmission(task.id))}
              >
                {t("requestResubmission")}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
