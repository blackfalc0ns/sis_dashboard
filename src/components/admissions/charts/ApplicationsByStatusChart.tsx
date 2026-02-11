// FILE: src/components/admissions/charts/ApplicationsByStatusChart.tsx

"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { ApplicationStatus } from "@/types/admissions";

interface ApplicationsByStatusChartProps {
  data: { status: ApplicationStatus; count: number }[];
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  submitted: "#3b82f6", // blue
  documents_pending: "#f59e0b", // amber
  under_review: "#8b5cf6", // purple
  accepted: "#10b981", // green
  waitlisted: "#f97316", // orange
  rejected: "#ef4444", // red
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  documents_pending: "Docs Pending",
  under_review: "Under Review",
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
};

export default function ApplicationsByStatusChart({
  data,
}: ApplicationsByStatusChartProps) {
  const chartData = data.map((item, index) => ({
    id: index,
    value: item.count,
    label: STATUS_LABELS[item.status],
    color: STATUS_COLORS[item.status],
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Applications by Status
        </h3>
        <p className="text-sm text-gray-500">
          Distribution across all statuses
        </p>
      </div>

      <div className="flex items-center justify-center">
        <PieChart
          series={[
            {
              data: chartData,
              innerRadius: 60,
              outerRadius: 100,
              paddingAngle: 2,
              cornerRadius: 4,
              highlightScope: { fade: "global", highlight: "item" },
              faded: { innerRadius: 30, additionalRadius: -10, color: "gray" },
            },
          ]}
          height={280}
          slotProps={{
            legend: {
              hidden: true,
            } as any,
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {data.map((item) => (
          <div key={item.status} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] }}
              />
              <span className="text-sm text-gray-700">
                {STATUS_LABELS[item.status]}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-900">
                {item.count}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
