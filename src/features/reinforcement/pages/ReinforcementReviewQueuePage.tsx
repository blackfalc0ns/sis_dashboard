"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementReviewQueueTable from "../components/tables/ReinforcementReviewQueueTable";
import type { ReinforcementReviewItem } from "../types/reinforcement";
import {
  approveTask,
  getReinforcementReviewQueue,
  rejectTask,
  requestResubmission,
} from "../services/reinforcementService";

export default function ReinforcementReviewQueuePage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("reinforcement");
  const [items, setItems] = useState<ReinforcementReviewItem[]>([]);

  useEffect(() => {
    getReinforcementReviewQueue().then(setItems);
  }, []);

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <ReinforcementPageHeader
        title={t("reviewQueue")}
        description={t("reviewDescription")}
      />

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <ReinforcementReviewQueueTable
          items={items}
          onView={(item) => router.push(`/${locale}/reinforcement/tasks/${item.taskId}`)}
          onApprove={async (item) => {
            await approveTask(item.taskId);
            getReinforcementReviewQueue().then(setItems);
          }}
          onReject={async (item) => {
            await rejectTask(item.taskId);
            getReinforcementReviewQueue().then(setItems);
          }}
          onResubmit={async (item) => {
            await requestResubmission(item.taskId);
            getReinforcementReviewQueue().then(setItems);
          }}
        />
      </div>
    </div>
  );
}
