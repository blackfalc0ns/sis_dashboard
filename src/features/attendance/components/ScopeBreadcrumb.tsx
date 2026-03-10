"use client";

import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Stage, Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";

interface ScopeBreadcrumbProps {
  scopeType: AttendanceScopeType;
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
  };
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
}

/**
 * Displays the current scope as a breadcrumb trail
 * Example: School > Primary > Grade 1 > Section A
 */
export default function ScopeBreadcrumb({
  scopeType,
  scopeIds,
  stages,
  grades,
  sections,
}: ScopeBreadcrumbProps) {
  const locale = useLocale();

  const getBreadcrumbItems = () => {
    const items: { label: string; level: string }[] = [];

    // Always start with scope type
    if (scopeType === "SCHOOL") {
      items.push({ label: locale === "ar" ? "المدرسة" : "School", level: "school" });
      return items;
    }

    // Add stage
    if (scopeIds?.stageId) {
      const stage = stages.find((s) => s.id === scopeIds.stageId);
      if (stage) {
        items.push({
          label: locale === "ar" ? stage.nameAr : stage.nameEn,
          level: "stage",
        });
      }
    }

    // Add grade if scope is GRADE or SECTION
    if ((scopeType === "GRADE" || scopeType === "SECTION") && scopeIds?.gradeId) {
      const grade = grades.find((g) => g.id === scopeIds.gradeId);
      if (grade) {
        items.push({
          label: locale === "ar" ? grade.nameAr : grade.nameEn,
          level: "grade",
        });
      }
    }

    // Add section if scope is SECTION
    if (scopeType === "SECTION" && scopeIds?.sectionId) {
      const section = sections.find((s) => s.id === scopeIds.sectionId);
      if (section) {
        items.push({
          label: locale === "ar" ? section.nameAr : section.nameEn,
          level: "section",
        });
      }
    }

    return items;
  };

  const items = getBreadcrumbItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 rounded-lg text-sm"
      style={{
        backgroundColor: "var(--background-secondary)",
        color: "var(--text-secondary)",
      }}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            locale === "ar" ? <ChevronLeft
              className="w-4 h-4"
              style={{ color: "var(--text-tertiary)" }}
            /> : <ChevronRight
              className="w-4 h-4"
              style={{ color: "var(--text-tertiary)" }}
            />
          )}
          <span
            className={index === items.length - 1 ? "font-medium" : ""}
            style={{
              color:
                index === items.length - 1
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
