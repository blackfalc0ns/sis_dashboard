"use client";

import { HelpCircle } from "lucide-react";
import { PieChart } from "@mui/x-charts/PieChart";
import { useTranslations } from "next-intl";

export default function AttendanceCard() {
  const t = useTranslations("attendance");
  const data = [
    { id: 0, value: 75, color: "#036b80" },
    { id: 1, value: 25, color: "#F5E6D3" },
  ];

  return (
    <div className="bg-white rounded-[20px] p-8 shadow-(--main-box-shadow)">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{t("title")}</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-center mb-6 ">
        <PieChart
          series={[
            {
              data,
              innerRadius: 90,
              outerRadius: 120,
              paddingAngle: 0,
              cornerRadius: 8,
              startAngle: -90,
              endAngle: 90,
              cx: 150,
              cy: 150,
            },
          ]}
          width={300}
          height={200}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      </div>

      <div className="flex items-center justify-around">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-(--primary-color)" />
          <div>
            <p className="text-2xl font-bold text-gray-900">75%</p>
            <p className="text-xs text-gray-500">{t("present")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#F5E6D3]" />
          <div>
            <p className="text-2xl font-bold text-gray-900">25%</p>
            <p className="text-xs text-gray-500">{t("absent")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
