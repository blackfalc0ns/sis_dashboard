"use client";

import {
  Award,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Coins,
  Percent,
} from "lucide-react";

const preferredMetricKeys = [
  "inProgress",
  "notCompleted",
  "completedThisWeek",
  "rewardedStudents",
  "averageCompletionRate",
  "totalRewardsIssued",
] as const;

const metricIcons = {
  inProgress: ClipboardList,
  notCompleted: CircleDashed,
  completedThisWeek: CheckCircle2,
  rewardedStudents: Award,
  averageCompletionRate: Percent,
  totalRewardsIssued: Coins,
} as const;

const iconStyles = [
  "bg-cyan-50 text-cyan-700",
  "bg-amber-50 text-amber-700",
  "bg-emerald-50 text-emerald-700",
  "bg-violet-50 text-violet-700",
  "bg-teal-50 text-teal-700",
  "bg-blue-50 text-blue-700",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toDisplayLabel = (key: string): string =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const toDisplayValue = (value: unknown): string => {
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "0";
};

export interface ReinforcementMetricCardsProps {
  metrics?: Record<string, unknown> | null;
  labels?: Partial<Record<string, string>>;
  emptyMessage: string;
}

export default function ReinforcementMetricCards({
  metrics,
  labels = {},
  emptyMessage,
}: ReinforcementMetricCardsProps) {
  if (!isRecord(metrics)) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const keys = [
    ...preferredMetricKeys.filter((key) => key in metrics),
    ...Object.keys(metrics).filter(
      (key) => !preferredMetricKeys.includes(key as (typeof preferredMetricKeys)[number]),
    ),
  ].slice(0, 8);

  if (keys.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {keys.map((key, index) => {
        const Icon =
          metricIcons[key as keyof typeof metricIcons] || ClipboardList;
        const iconClass = iconStyles[index % iconStyles.length];

        return (
          <article
            key={key}
            className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-500">
                  {labels[key] || toDisplayLabel(key)}
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {toDisplayValue(metrics[key])}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
