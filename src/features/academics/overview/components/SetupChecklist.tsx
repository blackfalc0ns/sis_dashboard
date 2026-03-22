"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { CheckCircle2, AlertCircle, XCircle, ArrowRight } from "lucide-react";
import Button from "@/components/ui/button/Button";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { ChecklistItem } from "../services/overviewService";
import type { OverviewMetrics } from "../services/overviewService";

interface SetupChecklistProps {
  items: ChecklistItem[];
  metrics?: OverviewMetrics;
  isLoading?: boolean;
}

export default function SetupChecklist({ items, metrics, isLoading }: SetupChecklistProps) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex min-h-[220px] items-center justify-center">
          <PartialLoader />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-6 h-6 text-amber-600" />;
      case "error":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-50 border-green-200 hover:bg-green-100";
      case "warning":
        return "bg-amber-50 border-amber-200 hover:bg-amber-100";
      case "error":
        return "bg-red-50 border-red-200 hover:bg-red-100";
      default:
        return "bg-gray-50 border-gray-200 hover:bg-gray-100";
    }
  };

  const getReasonText = (item: ChecklistItem) => {
    switch (item.id) {
      case "structure":
        if (metrics.structure.gradesWithoutSections > 0) {
          return t("academics.overview.checklist.structure.reason", {
            count: metrics.structure.gradesWithoutSections,
          });
        }
        if (metrics.structure.sectionsWithoutCapacity > 0) {
          return t("academics.overview.checklist.structure.reasonCapacity", {
            count: metrics.structure.sectionsWithoutCapacity,
          });
        }
        return t("academics.overview.checklist.allGood");
      case "subjects":
        if (metrics.subjects.completionPercentage < 100) {
          return t("academics.overview.checklist.subjects.reason", {
            percentage: metrics.subjects.completionPercentage,
          });
        }
        return t("academics.overview.checklist.allGood");
      case "teachers":
        if (metrics.teacherAllocation.missingAllocations > 0) {
          return t("academics.overview.checklist.teachers.reason", {
            count: metrics.teacherAllocation.missingAllocations,
          });
        }
        if (metrics.teacherAllocation.overloadedTeachers > 0) {
          return t("academics.overview.checklist.teachers.reasonOverloaded", {
            count: metrics.teacherAllocation.overloadedTeachers,
          });
        }
        return t("academics.overview.checklist.allGood");
      case "calendar":
        return item.status === "done"
          ? t("academics.overview.checklist.allGood")
          : t("academics.overview.checklist.calendar.reason");
      case "lessonPlans":
        return t("academics.overview.checklist.lessonPlans.reason", {
          count: metrics.lessonPlans.totalPlanned,
        });
      default:
        return "";
    }
  };

  const doneCount = items.filter((i) => i.status === "done").length;
  const totalCount = items.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("academics.overview.checklist.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("academics.overview.checklist.progress", { done: doneCount, total: totalCount })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{Math.round((doneCount / totalCount) * 100)}%</div>
            <div className="text-xs text-gray-500">{t("academics.overview.checklist.complete")}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
            style={{ width: `${(doneCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-4 border rounded-lg transition-all ${getStatusBg(
              item.status
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getStatusIcon(item.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-gray-900 text-sm">{t(item.titleKey)}</p>
                {item.status !== "done" && (
                  <Link href={item.link}>
                    <Button variant="secondary" size="sm" className="h-7 px-2 text-xs" leftIcon={<ArrowRight className="w-3 h-3 ml-1" />}> 
                      {t("academics.overview.checklist.fix")}
                      
                    </Button>
                  </Link>
                )}
              </div>
              <p className="text-xs text-gray-600">{getReasonText(item)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
