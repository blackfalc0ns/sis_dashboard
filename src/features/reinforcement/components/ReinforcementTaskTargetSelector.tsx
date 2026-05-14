"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import {
  fetchAcademicStructureTree,
  type AcademicStructureTree,
} from "@/features/academics/services/academicStructureApiService";
import {
  fetchStudentsWithEnrollmentForContext,
  type StudentWithEnrollmentContext,
} from "@/features/students-guardians/students/services/studentsService";
import { useAuth } from "@/hooks/use-auth";
import type {
  ReinforcementTargetPayload,
  ReinforcementTargetScope,
} from "@/features/reinforcement/types";

type Locale = "ar" | "en";

interface TargetOption {
  value: string;
  label: string;
  scopeType: ReinforcementTargetScope;
  searchText?: string;
  enrollmentId?: string;
}

export interface ReinforcementTaskTargetSelection
  extends ReinforcementTargetPayload {
  label?: string;
  enrollmentId?: string;
}

export interface ReinforcementTaskTargetSelectorProps {
  academicYearId?: string;
  termId?: string;
  value?: ReinforcementTaskTargetSelection[];
  onChange: (targets: ReinforcementTaskTargetSelection[]) => void;
  defaultScope?: ReinforcementTargetScope;
  disabled?: boolean;
  className?: string;
}

interface LoadState {
  tree: AcademicStructureTree;
  students: StudentWithEnrollmentContext[];
  loading: boolean;
  error: string | null;
}

const labels = {
  en: {
    scope: "Target scope",
    target: "Target",
    add: "Add target",
    selected: "Selected targets",
    noTargets: "No targets selected yet.",
    duplicate: "This target is already selected.",
    loading: "Loading target options...",
    error: "Could not load target options.",
    noOptions: "No options available",
    search: "Search...",
    school: "School",
    stage: "Stage",
    grade: "Grade",
    section: "Section",
    classroom: "Classroom",
    student: "Student",
    wholeSchool: "Whole school",
  },
  ar: {
    scope: "نطاق الهدف",
    target: "الهدف",
    add: "إضافة هدف",
    selected: "الأهداف المحددة",
    noTargets: "لا توجد أهداف محددة بعد.",
    duplicate: "هذا الهدف محدد بالفعل.",
    loading: "جارٍ تحميل خيارات الأهداف...",
    error: "تعذر تحميل خيارات الأهداف.",
    noOptions: "لا توجد خيارات متاحة",
    search: "بحث...",
    school: "المدرسة",
    stage: "المرحلة",
    grade: "الصف",
    section: "الشعبة",
    classroom: "الفصل",
    student: "الطالب",
    wholeSchool: "المدرسة بالكامل",
  },
} satisfies Record<Locale, Record<string, string>>;

const scopeOrder: ReinforcementTargetScope[] = [
  "student",
  "classroom",
  "section",
  "grade",
  "stage",
  "school",
];

const emptyTree: AcademicStructureTree = {
  stages: [],
  grades: [],
  sections: [],
  classrooms: [],
};

const localized = (
  item: { id: string; name?: string; nameAr?: string; nameEn?: string },
  locale: Locale,
) =>
  (locale === "ar" ? item.nameAr || item.nameEn : item.nameEn || item.name) ||
  item.name ||
  item.id ||
  "";

const studentIdFor = (student: StudentWithEnrollmentContext): string =>
  student.id || student.student_id || "";

const studentLabel = (
  student: StudentWithEnrollmentContext,
  locale: Locale,
): string =>
  locale === "ar"
    ? student.full_name_ar || student.full_name_en || student.name || studentIdFor(student)
    : student.full_name_en || student.name || student.full_name_ar || studentIdFor(student);

const enrollmentIdFor = (
  student?: StudentWithEnrollmentContext,
): string | undefined => {
  const enrollment = student?.enrollment as
    | (StudentWithEnrollmentContext["enrollment"] & { id?: string })
    | undefined;
  return enrollment?.id || enrollment?.enrollmentId;
};

const toSelectOption = (option: TargetOption): SelectOption => ({
  value: option.value,
  label: option.label,
  searchText: option.searchText,
});

export default function ReinforcementTaskTargetSelector({
  academicYearId,
  termId,
  value = [],
  onChange,
  defaultScope = "student",
  disabled = false,
  className = "",
}: ReinforcementTaskTargetSelectorProps) {
  const locale = (useLocale() === "ar" ? "ar" : "en") as Locale;
  const { user } = useAuth();
  const schoolId = user?.activeMembership?.schoolId || undefined;
  const copy = labels[locale];
  const isRTL = locale === "ar";
  const [scope, setScope] = useState<ReinforcementTargetScope>(defaultScope);
  const [targetId, setTargetId] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const [state, setState] = useState<LoadState>({
    tree: emptyTree,
    students: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!academicYearId || !termId) {
      Promise.resolve().then(() => {
        setState({ tree: emptyTree, students: [], loading: false, error: null });
      });
      return;
    }

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setState((current) => ({ ...current, loading: true, error: null }));
      }
    });

    Promise.all([
      fetchAcademicStructureTree({ yearId: academicYearId, termId }),
      fetchStudentsWithEnrollmentForContext(academicYearId, termId),
    ])
      .then(([tree, students]) => {
        if (!cancelled) {
          setState({ tree, students, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            tree: emptyTree,
            students: [],
            loading: false,
            error: error instanceof Error ? error.message : copy.error,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [academicYearId, copy.error, termId]);

  const optionsByScope = useMemo<Record<ReinforcementTargetScope, TargetOption[]>>(
    () => ({
      school: schoolId
        ? [
            {
              value: schoolId,
              label: copy.wholeSchool,
              scopeType: "school" as const,
            },
          ]
        : [],
      stage: state.tree.stages.map((item) => ({
        value: item.id,
        label: localized(item, locale),
        scopeType: "stage",
        searchText: `${item.nameEn || ""} ${item.nameAr || ""}`,
      })),
      grade: state.tree.grades.map((item) => ({
        value: item.id,
        label: localized(item, locale),
        scopeType: "grade",
        searchText: `${item.nameEn || ""} ${item.nameAr || ""}`,
      })),
      section: state.tree.sections.map((item) => ({
        value: item.id,
        label: localized(item, locale),
        scopeType: "section",
        searchText: `${item.nameEn || ""} ${item.nameAr || ""}`,
      })),
      classroom: state.tree.classrooms.map((item) => ({
        value: item.id,
        label: localized(item, locale),
        scopeType: "classroom",
        searchText: `${item.nameEn || ""} ${item.nameAr || ""}`,
      })),
      student: state.students
        .map((student) => ({
          value: studentIdFor(student),
          label: studentLabel(student, locale),
          scopeType: "student" as const,
          enrollmentId: enrollmentIdFor(student),
          searchText: `${student.full_name_en || ""} ${student.full_name_ar || ""} ${student.student_id || ""}`,
        }))
        .filter((option) => option.value),
    }),
    [copy.wholeSchool, locale, schoolId, state.students, state.tree],
  );

  const currentOptions = optionsByScope[scope] || [];
  const scopeOptions = scopeOrder.map((item) => ({
    value: item,
    label: copy[item],
  }));

  const addTarget = () => {
    const option = currentOptions.find((item) => item.value === targetId);
    if (!option) return;

    const exists = value.some(
      (item) => item.scopeType === scope && item.scopeId === option.value,
    );
    if (exists) {
      setDuplicateError(copy.duplicate);
      return;
    }

    setDuplicateError("");
    setTargetId("");
    onChange([
      ...value,
      {
        scopeType: scope,
        scopeId: option.value,
        label: option.label,
        enrollmentId: option.enrollmentId,
      },
    ]);
  };

  const removeTarget = (target: ReinforcementTaskTargetSelection) => {
    onChange(
      value.filter(
        (item) =>
          item.scopeType !== target.scopeType || item.scopeId !== target.scopeId,
      ),
    );
  };

  return (
    <section
      className={`space-y-4 ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
      aria-busy={state.loading}
    >
      {state.loading && (
        <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{copy.loading}</span>
        </div>
      )}
      {state.error && (
        <div className="flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end">
        <Select
          label={copy.scope}
          value={scope}
          disabled={disabled}
          options={scopeOptions}
          onChange={(nextScope) => {
            setScope(nextScope as ReinforcementTargetScope);
            setTargetId("");
            setDuplicateError("");
          }}
        />
        <Select
          label={copy.target}
          value={targetId}
          disabled={disabled || state.loading || !academicYearId || !termId}
          options={currentOptions.map(toSelectOption)}
          searchable
          searchPlaceholder={copy.search}
          noOptionsText={copy.noOptions}
          error={duplicateError}
          onChange={(nextTargetId) => {
            setTargetId(nextTargetId);
            setDuplicateError("");
          }}
        />
        <Button
          type="button"
          variant="primary"
          disabled={disabled || !targetId}
          onClick={addTarget}
          className="h-10"
        >
          <Plus className="h-4 w-4" />
          {copy.add}
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">
          {copy.selected}
        </h3>
        {value.length === 0 ? (
          <p className="text-sm text-gray-500">{copy.noTargets}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map((target) => (
              <span
                key={`${target.scopeType}:${target.scopeId}`}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary"
              >
                <span>
                  {copy[target.scopeType]}: {target.label || target.scopeId}
                </span>
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-primary/10"
                  onClick={() => removeTarget(target)}
                  disabled={disabled}
                  aria-label="Remove target"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
