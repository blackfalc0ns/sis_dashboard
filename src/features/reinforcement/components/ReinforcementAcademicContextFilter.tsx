"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import {
  fetchAcademicStructureTree,
  fetchAcademicYears,
  fetchTerms,
  type AcademicStructureClassroom,
  type AcademicStructureGrade,
  type AcademicStructureSection,
  type AcademicStructureStage,
  type AcademicStructureTree,
} from "@/features/academics/services/academicStructureApiService";
import {
  fetchSubjects,
  type Subject,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchStudentsWithEnrollmentForContext,
  type StudentWithEnrollmentContext,
} from "@/features/students-guardians/students/services/studentsService";

type Locale = "ar" | "en";

interface NamedRecord {
  id?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  [key: string]: unknown;
}

export interface ReinforcementAcademicContextValue {
  academicYearId?: string;
  termId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  subjectId?: string;
  studentId?: string;
  enrollmentId?: string;
}

export interface ReinforcementAcademicContextSelection
  extends ReinforcementAcademicContextValue {
  academicYear?: NamedRecord;
  term?: NamedRecord;
  stage?: AcademicStructureStage;
  grade?: AcademicStructureGrade;
  section?: AcademicStructureSection;
  classroom?: AcademicStructureClassroom;
  subject?: Subject;
  student?: StudentWithEnrollmentContext;
}

export interface ReinforcementAcademicContextFilterProps {
  value?: ReinforcementAcademicContextValue;
  onChange: (selection: ReinforcementAcademicContextSelection) => void;
  className?: string;
  disabled?: boolean;
  showSubject?: boolean;
  showStudent?: boolean;
}

interface LoadState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

const labels = {
  en: {
    academicYear: "Academic year",
    term: "Term",
    stage: "Stage",
    grade: "Grade",
    section: "Section",
    classroom: "Classroom",
    subject: "Subject",
    student: "Student",
    select: "Select",
    search: "Search...",
    noOptions: "No options available",
    loading: "Loading context options...",
    empty: "No context options are available.",
    error: "Could not load context options.",
  },
  ar: {
    academicYear: "العام الدراسي",
    term: "الفصل الدراسي",
    stage: "المرحلة",
    grade: "الصف",
    section: "الشعبة",
    classroom: "الفصل",
    subject: "المادة",
    student: "الطالب",
    select: "اختر",
    search: "بحث...",
    noOptions: "لا توجد خيارات متاحة",
    loading: "جارٍ تحميل خيارات السياق...",
    empty: "لا توجد خيارات سياق متاحة.",
    error: "تعذر تحميل خيارات السياق.",
  },
} satisfies Record<Locale, Record<string, string>>;

const emptyTree: AcademicStructureTree = {
  stages: [],
  grades: [],
  sections: [],
  classrooms: [],
};

const getString = (record: unknown, keys: string[]): string | undefined => {
  if (!record || typeof record !== "object") return undefined;
  const source = record as Record<string, unknown>;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") return value;
    if (typeof value === "number") return String(value);
  }
  return undefined;
};

const getId = (record: unknown): string =>
  getString(record, ["id", "academicYearId", "yearId", "termId", "studentId"]) ||
  "";

const getLocalizedName = (record: unknown, locale: Locale): string => {
  const primaryKeys =
    locale === "ar"
      ? ["nameAr", "titleAr", "full_name_ar", "fullNameAr", "name"]
      : ["nameEn", "titleEn", "full_name_en", "fullNameEn", "name"];
  return (
    getString(record, primaryKeys) ||
    getString(record, ["name", "title", "label", "code", "id"]) ||
    ""
  );
};

const toOption = (record: unknown, locale: Locale): SelectOption | null => {
  const value = getId(record);
  if (!value) return null;
  const label = getLocalizedName(record, locale) || value;
  return {
    value,
    label,
    searchText: `${label} ${getLocalizedName(record, locale === "ar" ? "en" : "ar")}`,
  };
};

const compactOptions = (options: Array<SelectOption | null>): SelectOption[] =>
  options.filter((option): option is SelectOption => Boolean(option));

const studentIdFor = (student: StudentWithEnrollmentContext): string =>
  student.id || student.student_id || "";

const enrollmentIdFor = (
  student?: StudentWithEnrollmentContext,
): string | undefined => {
  const enrollment = student?.enrollment as
    | (StudentWithEnrollmentContext["enrollment"] & { id?: string })
    | undefined;
  return enrollment?.id || enrollment?.enrollmentId;
};

const studentOption = (
  student: StudentWithEnrollmentContext,
  locale: Locale,
): SelectOption | null => {
  const value = studentIdFor(student);
  if (!value) return null;
  const label =
    locale === "ar"
      ? student.full_name_ar || student.full_name_en || student.name || value
      : student.full_name_en || student.name || student.full_name_ar || value;
  return {
    value,
    label,
    searchText: `${student.full_name_en || ""} ${student.full_name_ar || ""} ${student.student_id || ""}`,
  };
};

export default function ReinforcementAcademicContextFilter({
  value = {},
  onChange,
  className = "",
  disabled = false,
  showSubject = true,
  showStudent = true,
}: ReinforcementAcademicContextFilterProps) {
  const locale = (useLocale() === "ar" ? "ar" : "en") as Locale;
  const copy = labels[locale];
  const isRTL = locale === "ar";
  const [years, setYears] = useState<LoadState<NamedRecord[]>>({
    data: [],
    loading: true,
    error: null,
  });
  const [terms, setTerms] = useState<LoadState<NamedRecord[]>>({
    data: [],
    loading: false,
    error: null,
  });
  const [tree, setTree] = useState<LoadState<AcademicStructureTree>>({
    data: emptyTree,
    loading: false,
    error: null,
  });
  const [subjects, setSubjects] = useState<LoadState<Subject[]>>({
    data: [],
    loading: false,
    error: null,
  });
  const [students, setStudents] = useState<
    LoadState<StudentWithEnrollmentContext[]>
  >({
    data: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setYears((current) => ({ ...current, loading: true, error: null }));
      }
    });
    void fetchAcademicYears()
      .then((items) => {
        if (!cancelled) {
          setYears({ data: items as NamedRecord[], loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setYears({
            data: [],
            loading: false,
            error: error instanceof Error ? error.message : copy.error,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [copy.error]);

  useEffect(() => {
    if (!value.academicYearId) {
      Promise.resolve().then(() => {
        setTerms({ data: [], loading: false, error: null });
      });
      return;
    }

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setTerms((current) => ({ ...current, loading: true, error: null }));
      }
    });
    void fetchTerms(value.academicYearId)
      .then((items) => {
        if (!cancelled) {
          setTerms({ data: items as NamedRecord[], loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setTerms({
            data: [],
            loading: false,
            error: error instanceof Error ? error.message : copy.error,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [copy.error, value.academicYearId]);

  useEffect(() => {
    if (!value.academicYearId || !value.termId) {
      Promise.resolve().then(() => {
        setTree({ data: emptyTree, loading: false, error: null });
        setSubjects({ data: [], loading: false, error: null });
        setStudents({ data: [], loading: false, error: null });
      });
      return;
    }

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setTree((current) => ({ ...current, loading: true, error: null }));
        setSubjects((current) => ({ ...current, loading: true, error: null }));
        setStudents((current) => ({ ...current, loading: true, error: null }));
      }
    });

    void fetchAcademicStructureTree({
      yearId: value.academicYearId,
      termId: value.termId,
    })
      .then((nextTree) => {
        if (!cancelled) {
          setTree({ data: nextTree, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setTree({
            data: emptyTree,
            loading: false,
            error: error instanceof Error ? error.message : copy.error,
          });
        }
      });

    void fetchSubjects(value.termId)
      .then((items) => {
        if (!cancelled) {
          setSubjects({ data: items, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSubjects({
            data: [],
            loading: false,
            error: error instanceof Error ? error.message : copy.error,
          });
        }
      });

    void fetchStudentsWithEnrollmentForContext(
      value.academicYearId,
      value.termId,
    )
      .then((items) => {
        if (!cancelled) {
          setStudents({ data: items, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStudents({
            data: [],
            loading: false,
            error: error instanceof Error ? error.message : copy.error,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [copy.error, value.academicYearId, value.termId]);

  const selected = useMemo<ReinforcementAcademicContextSelection>(() => {
    const student = students.data.find(
      (item) => studentIdFor(item) === value.studentId,
    );
    return {
      ...value,
      enrollmentId: value.enrollmentId || enrollmentIdFor(student),
      academicYear: years.data.find((item) => getId(item) === value.academicYearId),
      term: terms.data.find((item) => getId(item) === value.termId),
      stage: tree.data.stages.find((item) => item.id === value.stageId),
      grade: tree.data.grades.find((item) => item.id === value.gradeId),
      section: tree.data.sections.find((item) => item.id === value.sectionId),
      classroom: tree.data.classrooms.find((item) => item.id === value.classroomId),
      subject: subjects.data.find((item) => item.id === value.subjectId),
      student,
    };
  }, [students.data, subjects.data, terms.data, tree.data, value, years.data]);

  const emit = (patch: ReinforcementAcademicContextValue) => {
    const next: ReinforcementAcademicContextValue = { ...value, ...patch };
    const nextStudent = students.data.find(
      (item) => studentIdFor(item) === next.studentId,
    );
    onChange({
      ...next,
      enrollmentId: next.enrollmentId || enrollmentIdFor(nextStudent),
      academicYear: years.data.find((item) => getId(item) === next.academicYearId),
      term: terms.data.find((item) => getId(item) === next.termId),
      stage: tree.data.stages.find((item) => item.id === next.stageId),
      grade: tree.data.grades.find((item) => item.id === next.gradeId),
      section: tree.data.sections.find((item) => item.id === next.sectionId),
      classroom: tree.data.classrooms.find((item) => item.id === next.classroomId),
      subject: subjects.data.find((item) => item.id === next.subjectId),
      student: nextStudent,
    });
  };

  const filteredGrades = tree.data.grades.filter(
    (grade) => !value.stageId || grade.stageId === value.stageId,
  );
  const filteredSections = tree.data.sections.filter(
    (section) => !value.gradeId || section.gradeId === value.gradeId,
  );
  const filteredClassrooms = tree.data.classrooms.filter(
    (classroom) => !value.sectionId || classroom.sectionId === value.sectionId,
  );

  const loading =
    years.loading ||
    terms.loading ||
    tree.loading ||
    subjects.loading ||
    students.loading;
  const error =
    years.error || terms.error || tree.error || subjects.error || students.error;
  const isEmpty = !loading && !error && years.data.length === 0;

  return (
    <section
      className={`space-y-4 ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
      aria-busy={loading}
    >
      {loading && (
        <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{copy.loading}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{error || copy.error}</span>
        </div>
      )}
      {isEmpty && (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          {copy.empty}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Select
          label={copy.academicYear}
          value={value.academicYearId || ""}
          disabled={disabled || years.loading}
          options={compactOptions(years.data.map((item) => toOption(item, locale)))}
          placeholder={`${copy.select} ${copy.academicYear}`}
          searchable
          searchPlaceholder={copy.search}
          noOptionsText={copy.noOptions}
          onChange={(academicYearId) =>
            emit({
              academicYearId,
              termId: undefined,
              stageId: undefined,
              gradeId: undefined,
              sectionId: undefined,
              classroomId: undefined,
              subjectId: undefined,
              studentId: undefined,
              enrollmentId: undefined,
            })
          }
        />
        <Select
          label={copy.term}
          value={value.termId || ""}
          disabled={disabled || !value.academicYearId || terms.loading}
          options={compactOptions(terms.data.map((item) => toOption(item, locale)))}
          placeholder={`${copy.select} ${copy.term}`}
          searchable
          searchPlaceholder={copy.search}
          noOptionsText={copy.noOptions}
          onChange={(termId) =>
            emit({
              termId,
              stageId: undefined,
              gradeId: undefined,
              sectionId: undefined,
              classroomId: undefined,
              subjectId: undefined,
              studentId: undefined,
              enrollmentId: undefined,
            })
          }
        />
        <Select
          label={copy.stage}
          value={value.stageId || ""}
          disabled={disabled || !value.termId || tree.loading}
          options={compactOptions(tree.data.stages.map((item) => toOption(item, locale)))}
          placeholder={`${copy.select} ${copy.stage}`}
          searchable
          searchPlaceholder={copy.search}
          noOptionsText={copy.noOptions}
          onChange={(stageId) =>
            emit({
              stageId,
              gradeId: undefined,
              sectionId: undefined,
              classroomId: undefined,
              studentId: undefined,
              enrollmentId: undefined,
            })
          }
        />
        <Select
          label={copy.grade}
          value={value.gradeId || ""}
          disabled={disabled || !value.termId || tree.loading}
          options={compactOptions(filteredGrades.map((item) => toOption(item, locale)))}
          placeholder={`${copy.select} ${copy.grade}`}
          searchable
          searchPlaceholder={copy.search}
          noOptionsText={copy.noOptions}
          onChange={(gradeId) =>
            emit({
              gradeId,
              sectionId: undefined,
              classroomId: undefined,
              studentId: undefined,
              enrollmentId: undefined,
            })
          }
        />
        <Select
          label={copy.section}
          value={value.sectionId || ""}
          disabled={disabled || !value.termId || tree.loading}
          options={compactOptions(filteredSections.map((item) => toOption(item, locale)))}
          placeholder={`${copy.select} ${copy.section}`}
          searchable
          searchPlaceholder={copy.search}
          noOptionsText={copy.noOptions}
          onChange={(sectionId) =>
            emit({
              sectionId,
              classroomId: undefined,
              studentId: undefined,
              enrollmentId: undefined,
            })
          }
        />
        <Select
          label={copy.classroom}
          value={value.classroomId || ""}
          disabled={disabled || !value.termId || tree.loading}
          options={compactOptions(
            filteredClassrooms.map((item) => toOption(item, locale)),
          )}
          placeholder={`${copy.select} ${copy.classroom}`}
          searchable
          searchPlaceholder={copy.search}
          noOptionsText={copy.noOptions}
          onChange={(classroomId) => emit({ classroomId })}
        />
        {showSubject && (
          <Select
            label={copy.subject}
            value={value.subjectId || ""}
            disabled={disabled || !value.termId || subjects.loading}
            options={compactOptions(subjects.data.map((item) => toOption(item, locale)))}
            placeholder={`${copy.select} ${copy.subject}`}
            searchable
            searchPlaceholder={copy.search}
            noOptionsText={copy.noOptions}
            onChange={(subjectId) => emit({ subjectId })}
          />
        )}
        {showStudent && (
          <Select
            label={copy.student}
            value={selected.studentId || ""}
            disabled={disabled || !value.termId || students.loading}
            options={compactOptions(
              students.data.map((item) => studentOption(item, locale)),
            )}
            placeholder={`${copy.select} ${copy.student}`}
            searchable
            searchPlaceholder={copy.search}
            noOptionsText={copy.noOptions}
            onChange={(studentId) => {
              const student = students.data.find(
                (item) => studentIdFor(item) === studentId,
              );
              emit({ studentId, enrollmentId: enrollmentIdFor(student) });
            }}
          />
        )}
      </div>
    </section>
  );
}
