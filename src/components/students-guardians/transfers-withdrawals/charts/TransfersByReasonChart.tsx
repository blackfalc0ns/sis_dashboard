// FILE: src/components/students-guardians/transfers-withdrawals/charts/TransfersByReasonChart.tsx

"use client";

import { useTranslations } from "next-intl";
import { PieChart } from "@mui/x-charts/PieChart";
import { PieChart as PieIcon } from "lucide-react";

export default function TransfersByReasonChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals.charts");

  // TODO: Replace with actual API data
  const data = [
    { id: 0, value: 35, label: t("reasons.academic") },
    { id: 1, value: 25, label: t("reasons.relocation") },
    { id: 2, value: 20, label: t("reasons.better_fit") },
    { id: 3, value: 20, label: t("reasons.other") },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <PieIcon className="w-5 h-5 text-[#036b80]" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t("transfers_by_reason")}
        </h3>
      </div>

      <PieChart
        series={[
          {
            data,
            highlightScope: { fade: "global", highlight: "item" },
          },
        ]}
        height={300}
      />
    </div>
  );
}
