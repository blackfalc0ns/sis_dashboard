"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import ScopePicker from "../ScopePicker";
import type { PolicyFormData, AttendanceScopeType } from "../../types";
import type {
  Stage,
  Grade,
  Section,
  Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface Step2ScopeProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  stages: Stage[];
  filteredGrades: Grade[];
  filteredSections: Section[];
  filteredClassrooms: Classroom[];
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}

export default function Step2Scope({
  formData,
  errors,
  isReadOnly,
  stages,
  filteredGrades,
  filteredSections,
  filteredClassrooms,
  onFieldChange,
}: Step2ScopeProps) {
  const t = useTranslations("attendance.policies.wizard");

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <div className="font-semibold mb-1">{t("steps.scope.priorityTitle")}</div>
          <div>{t("steps.scope.priorityDesc")}</div>
        </div>
      </div>

      {/* Scope Selection Cards */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t("fields.scope")} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {(["SCHOOL", "STAGE", "GRADE", "SECTION", "CLASSROOM"] as AttendanceScopeType[]).map(
            (scopeType) => (
              <div
                key={scopeType}
                onClick={() => {
                  onFieldChange("scopeType", scopeType);
                  onFieldChange("scopeIds", {});
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.scopeType === scopeType
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.scopeType === scopeType
                        ? "border-primary bg-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.scopeType === scopeType && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="font-semibold text-sm">
                    {t(`scope.${scopeType.toLowerCase()}`)}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {t(`scope.${scopeType.toLowerCase()}Desc`)}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-color)" }}>
        <ScopePicker
          scopeType={formData.scopeType}
          scopeIds={formData.scopeIds || {}}
          stages={stages}
          grades={filteredGrades}
          sections={filteredSections}
          classrooms={filteredClassrooms}
          onScopeTypeChange={(scopeType) => {
            onFieldChange("scopeType", scopeType);
            onFieldChange("scopeIds", {});
          }}
          onScopeIdsChange={(scopeIds) => {
            onFieldChange("scopeIds", {
              ...(formData.scopeIds || {}),
              ...scopeIds,
            });
          }}
          disabled={isReadOnly}
          errors={{
            scopeType: errors.scopeType,
            stageId: errors.stageId,
            gradeId: errors.gradeId,
            sectionId: errors.sectionId,
            classroomId: errors.classroomId,
          }}
        />
      </div>
    </div>
  );
}
