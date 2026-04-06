"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Save, X, AlertTriangle } from "lucide-react";
import { Student, RiskFlag } from "@/features/students-guardians/students/types";
import {
  composeNameParts,
  getRiskFlagColor,
  getRiskFlagLabel,
  splitFullName,
} from "@/features/students-guardians/students/utils/studentUtils";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  fetchAcademicYears,
  getStructureTreeSnapshot,
  resolveStructureContextForAcademicYear,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  getCurrentActiveEnrollment,
  updateEnrollment,
  upsertEnrollment,
  validateEnrollmentPlacement,
} from "@/features/students-guardians/students/services/enrollmentService";
import { updateStudent } from "@/features/students-guardians/students/services/studentsService";

interface PersonalInfoTabProps {
  student: Student;
  onStudentUpdated?: () => void;
}

type PersonalInfoFormData = {
  name: string;
  first_name_en: string;
  father_name_en: string;
  grandfather_name_en: string;
  family_name_en: string;
  first_name_ar: string;
  father_name_ar: string;
  grandfather_name_ar: string;
  family_name_ar: string;
  full_name_en: string;
  full_name_ar: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  stage: string;
  grade: string;
  section: string;
  classroom: string;
  status: Student["status"];
  enrollment_year: string;
  address_line: string;
  city: string;
  district: string;
};

const buildPersonalInfoFormData = (
  student: Student,
  enrollment?: ReturnType<typeof getCurrentActiveEnrollment>,
): PersonalInfoFormData => {
  const englishParts = splitFullName(student.full_name_en || student.name || "");
  const arabicParts = splitFullName(student.full_name_ar || "");

  return {
  name: student.name || student.full_name_en,
  first_name_en: student.first_name_en || englishParts.firstName,
  father_name_en: student.father_name_en || englishParts.fatherName,
  grandfather_name_en:
    student.grandfather_name_en || englishParts.grandfatherName,
  family_name_en: student.family_name_en || englishParts.familyName,
  first_name_ar: student.first_name_ar || arabicParts.firstName,
  father_name_ar: student.father_name_ar || arabicParts.fatherName,
  grandfather_name_ar:
    student.grandfather_name_ar || arabicParts.grandfatherName,
  family_name_ar: student.family_name_ar || arabicParts.familyName,
  full_name_en: student.full_name_en || student.name || "",
  full_name_ar: student.full_name_ar || "",
  date_of_birth: student.date_of_birth || student.dateOfBirth || "",
  gender: student.gender,
  nationality: student.nationality,
  stage: student.stage || "",
  grade: enrollment?.grade || student.grade || "",
  section: enrollment?.section || student.section || "",
  classroom: enrollment?.classroom || "",
  status: student.status,
  enrollment_year:
    enrollment?.academicYear ||
    (student.enrollment_year ? String(student.enrollment_year) : "") ||
    (typeof student.academic_year === "string" ? student.academic_year : ""),
  address_line: student.contact?.address_line || "",
  city: student.contact?.city || "",
  district: student.contact?.district || "",
  };
};

const normalizeProfileValues = (formData: PersonalInfoFormData) => {
  const fullNameEn = composeNameParts(
    formData.first_name_en,
    formData.father_name_en,
    formData.grandfather_name_en,
    formData.family_name_en,
  );
  const fullNameAr = composeNameParts(
    formData.first_name_ar,
    formData.father_name_ar,
    formData.grandfather_name_ar,
    formData.family_name_ar,
  );

  return {
  name: fullNameEn,
  first_name_en: formData.first_name_en.trim(),
  father_name_en: formData.father_name_en.trim(),
  grandfather_name_en: formData.grandfather_name_en.trim(),
  family_name_en: formData.family_name_en.trim(),
  first_name_ar: formData.first_name_ar.trim(),
  father_name_ar: formData.father_name_ar.trim(),
  grandfather_name_ar: formData.grandfather_name_ar.trim(),
  family_name_ar: formData.family_name_ar.trim(),
  full_name_en: fullNameEn,
  full_name_ar: fullNameAr,
  date_of_birth: formData.date_of_birth,
  gender: formData.gender,
  nationality: formData.nationality.trim(),
  status: formData.status,
  contact: {
    address_line: formData.address_line.trim(),
    city: formData.city.trim(),
    district: formData.district.trim(),
    student_phone: undefined,
    student_email: undefined,
  },
  };
};

const getDisplayName = (item?: { name?: string; nameEn?: string; nameAr?: string }) =>
  item?.nameEn || item?.nameAr || item?.name || "";

const getSectionValue = (section?: { name?: string; nameEn?: string; nameAr?: string }) =>
  section
    ? section.nameEn?.replace(/^Section\s+/i, "") || section.nameAr || section.name || ""
    : "";

export default function PersonalInfoTab({
  student,
  onStudentUpdated,
}: PersonalInfoTabProps) {
  const t = useTranslations("students_guardians.profile.personal_info");
  const params = useParams();
  const locale = params.lang as string;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const enrollment = getCurrentActiveEnrollment(student.id);

  const initialFormData = useMemo<PersonalInfoFormData>(
    () => buildPersonalInfoFormData(student, enrollment),
    [enrollment, student],
  );

  const [formData, setFormData] = useState(initialFormData);
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);

  const structureContext = useMemo(() => {
    const academicYearName =
      formData.enrollment_year ||
      enrollment?.academicYear ||
      (typeof student.academic_year === "string" ? student.academic_year : "") ||
      "";

    return academicYearName
      ? resolveStructureContextForAcademicYear(academicYearName)
      : null;
  }, [enrollment?.academicYear, formData.enrollment_year, student.academic_year]);

  const structure = useMemo(() => {
    if (!structureContext) {
      return { stages: [], grades: [], sections: [], classrooms: [] };
    }

    return getStructureTreeSnapshot(
      structureContext.academicYearId,
      structureContext.termId,
    );
  }, [structureContext]);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const years = await fetchAcademicYears();
        setAcademicYearOptions(years.map((year) => year.name));
      } catch {
        setAcademicYearOptions([]);
      }
    };

    void loadAcademicYears();
  }, []);

  const availableStages = useMemo(() => {
    return structure.stages;
  }, [structure.stages]);

  const selectedStage = useMemo(() => {
    return (
      structure.stages.find(
        (stage) =>
          stage.name === formData.stage ||
          stage.nameEn === formData.stage ||
          stage.nameAr === formData.stage,
      ) || null
    );
  }, [formData.stage, structure.stages]);

  const availableGrades = useMemo(() => {
    return structure.grades
      .filter((grade) => !selectedStage || grade.stageId === selectedStage.id)
      .sort((a, b) => a.order - b.order);
  }, [selectedStage, structure.grades]);

  const selectedGrade = useMemo(() => {
    return (
      availableGrades.find(
        (grade) =>
          grade.id === enrollment?.gradeId ||
          grade.name === formData.grade ||
          grade.nameEn === formData.grade ||
          grade.nameAr === formData.grade,
      ) || null
    );
  }, [availableGrades, enrollment?.gradeId, formData.grade]);

  const availableSections = useMemo(() => {
    if (!selectedGrade) return [];

    return structure.sections
      .filter((section) => section.gradeId === selectedGrade.id)
      .sort((a, b) => a.order - b.order);
  }, [selectedGrade, structure.sections]);

  const selectedSection = useMemo(() => {
    return (
      availableSections.find((section) => {
        const sectionShortName =
          section.nameEn?.replace(/^Section\s+/i, "") ||
          section.nameAr ||
          section.name;

        return (
          section.id === enrollment?.sectionId ||
          section.name === formData.section ||
          section.nameEn === formData.section ||
          section.nameAr === formData.section ||
          sectionShortName === formData.section
        );
      }) || null
    );
  }, [availableSections, enrollment?.sectionId, formData.section]);

  const availableClassrooms = useMemo(() => {
    if (!selectedSection) return [];

    return structure.classrooms
      .filter((classroom) => classroom.sectionId === selectedSection.id)
      .sort((a, b) => a.order - b.order);
  }, [selectedSection, structure.classrooms]);

  const profileValidationError = useMemo(() => {
    if (!formData.first_name_en.trim()) return t("first_name_en");
    if (!formData.father_name_en.trim()) return t("father_name_en");
    if (!formData.grandfather_name_en.trim()) return t("grandfather_name_en");
    if (!formData.family_name_en.trim()) return t("family_name_en");
    if (!formData.first_name_ar.trim()) return t("first_name_ar");
    if (!formData.father_name_ar.trim()) return t("father_name_ar");
    if (!formData.grandfather_name_ar.trim()) return t("grandfather_name_ar");
    if (!formData.family_name_ar.trim()) return t("family_name_ar");
    if (!formData.date_of_birth) return t("date_of_birth");
    if (!formData.nationality.trim()) return t("nationality");
    return null;
  }, [
    formData.date_of_birth,
    formData.family_name_ar,
    formData.family_name_en,
    formData.father_name_ar,
    formData.father_name_en,
    formData.first_name_ar,
    formData.first_name_en,
    formData.grandfather_name_ar,
    formData.grandfather_name_en,
    formData.nationality,
    t,
  ]);

  const placementValidationError = useMemo(() => {
    if (!formData.enrollment_year) return t("enrollment_year");
    if (!selectedGrade) return t("grade");
    if (!selectedSection) return t("section");

    const selectedClassroom =
      availableClassrooms.find(
        (classroom) =>
          classroom.name === formData.classroom ||
          classroom.nameEn === formData.classroom ||
          classroom.nameAr === formData.classroom,
      ) || null;

    const validation = validateEnrollmentPlacement({
      studentId: student.id,
      academicYear: formData.enrollment_year,
      grade: getDisplayName(selectedGrade),
      section: getSectionValue(selectedSection),
      classroom: selectedClassroom ? getDisplayName(selectedClassroom) : undefined,
      gradeId: selectedGrade.id,
      sectionId: selectedSection.id,
      classroomId: selectedClassroom?.id,
      status: enrollment?.status || "active",
      enrollmentDate: enrollment?.enrollmentDate,
    }, {
      excludeStudentId: student.id,
    });

    return validation.valid ? null : validation.errors[0];
  }, [
    availableClassrooms,
    enrollment?.enrollmentDate,
    enrollment?.status,
    formData.classroom,
    formData.enrollment_year,
    selectedGrade,
    selectedSection,
    student.id,
    t,
  ]);

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    if (profileValidationError) {
      setSaveError(`${t("cannot_be_changed")}: ${profileValidationError}`);
      return;
    }

    if (placementValidationError) {
      setSaveError(placementValidationError);
      return;
    }

    setIsSaving(true);

    try {
      const normalizedProfile = normalizeProfileValues(formData);

      await updateStudent(student.id, {
        name: normalizedProfile.name,
        first_name_en: normalizedProfile.first_name_en,
        father_name_en: normalizedProfile.father_name_en,
        grandfather_name_en: normalizedProfile.grandfather_name_en,
        family_name_en: normalizedProfile.family_name_en,
        first_name_ar: normalizedProfile.first_name_ar,
        father_name_ar: normalizedProfile.father_name_ar,
        grandfather_name_ar: normalizedProfile.grandfather_name_ar,
        family_name_ar: normalizedProfile.family_name_ar,
        full_name_en: normalizedProfile.full_name_en,
        full_name_ar: normalizedProfile.full_name_ar,
        gender: normalizedProfile.gender,
        dateOfBirth: normalizedProfile.date_of_birth,
        date_of_birth: normalizedProfile.date_of_birth,
        nationality: normalizedProfile.nationality,
        status: normalizedProfile.status,
        contact: normalizedProfile.contact,
      });

      const selectedClassroom =
        availableClassrooms.find(
          (classroom) =>
            classroom.name === formData.classroom ||
            classroom.nameEn === formData.classroom ||
            classroom.nameAr === formData.classroom,
        ) || null;

      const placementPayload = {
        studentId: student.id,
        academicYear: formData.enrollment_year,
        grade: getDisplayName(selectedGrade || undefined),
        section: getSectionValue(selectedSection || undefined),
        classroom: selectedClassroom ? getDisplayName(selectedClassroom) : undefined,
        gradeId: selectedGrade?.id,
        sectionId: selectedSection?.id,
        classroomId: selectedClassroom?.id,
        enrollmentDate: enrollment?.enrollmentDate,
        status: enrollment?.status || "active",
      };

      if (enrollment) {
        await updateEnrollment(enrollment.enrollmentId, placementPayload);
      } else {
        await upsertEnrollment(placementPayload);
      }

      onStudentUpdated?.();
      setSaveSuccess(t("save_success"));
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSaveError(null);
    setSaveSuccess(null);
    setFormData(initialFormData);
    setIsEditing(false);
  };

  const handleStageChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      stage: value,
      grade: "",
      section: "",
      classroom: "",
    }));
  };

  const handleGradeChange = (value: string) => {
    const nextGrade = structure.grades.find(
      (grade) =>
        grade.name === value ||
        grade.nameEn === value ||
        grade.nameAr === value,
    );

    const nextStage = nextGrade
      ? structure.stages.find((stage) => stage.id === nextGrade.stageId)
      : null;

    setFormData((prev) => ({
      ...prev,
      stage: nextStage?.name || prev.stage,
      grade: value,
      section: "",
      classroom: "",
    }));
  };

  const handleSectionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      section: value,
      classroom: "",
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
        {!isEditing ? (
          <button
            onClick={() => {
              setSaveError(null);
              setSaveSuccess(null);
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            {t("edit")}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t("saving") : t("save")}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {saveError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {saveSuccess}
          </div>
        )}

        {student.risk_flags && student.risk_flags.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-orange-900 mb-2">
                  {t("risk_flags_detected")}
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {student.risk_flags.map((flag: RiskFlag) => (
                    <span
                      key={flag}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskFlagColor(flag)}`}
                    >
                      {getRiskFlagLabel(flag)}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-orange-700 mt-2">
                  {t("risk_flags_message")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("student_id")}
            </label>
            <input
              type="text"
              value={student.student_id}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">{t("cannot_be_changed")}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("full_name")}
            </label>
            <input
              type="text"
              value={composeNameParts(
                formData.first_name_en,
                formData.father_name_en,
                formData.grandfather_name_en,
                formData.family_name_en,
              )}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">{t("auto_generated")}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("first_name_en")}
            </label>
            <input
              type="text"
              value={formData.first_name_en}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, first_name_en: e.target.value }))
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("first_name_ar")}
            </label>
            <input
              type="text"
              value={formData.first_name_ar}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, first_name_ar: e.target.value }))
              }
              disabled={!isEditing}
              dir="rtl"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("father_name_en")}
            </label>
            <input
              type="text"
              value={formData.father_name_en}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, father_name_en: e.target.value }))
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("father_name_ar")}
            </label>
            <input
              type="text"
              value={formData.father_name_ar}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, father_name_ar: e.target.value }))
              }
              disabled={!isEditing}
              dir="rtl"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("grandfather_name_en")}
            </label>
            <input
              type="text"
              value={formData.grandfather_name_en}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  grandfather_name_en: e.target.value,
                }))
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("grandfather_name_ar")}
            </label>
            <input
              type="text"
              value={formData.grandfather_name_ar}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  grandfather_name_ar: e.target.value,
                }))
              }
              disabled={!isEditing}
              dir="rtl"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("family_name_en")}
            </label>
            <input
              type="text"
              value={formData.family_name_en}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, family_name_en: e.target.value }))
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("family_name_ar")}
            </label>
            <input
              type="text"
              value={formData.family_name_ar}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, family_name_ar: e.target.value }))
              }
              disabled={!isEditing}
              dir="rtl"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("gender")}
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, gender: e.target.value }))
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="Male">{t("male")}</option>
              <option value="Female">{t("female")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("date_of_birth")}
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("nationality")}
            </label>
            <input
              type="text"
              value={formData.nationality}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nationality: e.target.value }))
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("stage")}
            </label>
            <select
              value={formData.stage}
              onChange={(e) => handleStageChange(e.target.value)}
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="">{t("select_stage")}</option>
              {availableStages.map((stage) => (
                <option key={stage.id} value={stage.name}>
                  {locale === "ar"
                    ? stage.nameAr || stage.name
                    : stage.nameEn || stage.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("grade")}
            </label>
            <select
              value={formData.grade}
              onChange={(e) => handleGradeChange(e.target.value)}
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="">{t("select_grade")}</option>
              {availableGrades.map((grade) => {
                const gradeLabel =
                  locale === "ar"
                    ? grade.nameAr || grade.name
                    : grade.nameEn || grade.name;
                const gradeValue = grade.nameEn || grade.nameAr || grade.name;

                return (
                  <option key={grade.id} value={gradeValue}>
                    {gradeLabel}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("section")}
            </label>
            <select
              value={formData.section}
              onChange={(e) => handleSectionChange(e.target.value)}
              disabled={!isEditing || !formData.grade}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="">{t("select_section")}</option>
              {availableSections.map((section) => {
                const sectionValue =
                  section.nameEn?.replace(/^Section\s+/i, "") ||
                  section.nameAr ||
                  section.name;
                const sectionLabel =
                  locale === "ar"
                    ? section.nameAr || section.name
                    : section.nameEn || section.name;

                return (
                  <option key={section.id} value={sectionValue}>
                    {sectionLabel}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("classroom")}
            </label>
            <select
              value={formData.classroom}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, classroom: e.target.value }))
              }
              disabled={!isEditing || !formData.section}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="">{t("select_classroom")}</option>
              {availableClassrooms.map((classroom) => {
                const classroomLabel =
                  locale === "ar"
                    ? classroom.nameAr || classroom.name
                    : classroom.nameEn || classroom.name;
                const classroomValue =
                  classroom.nameEn || classroom.nameAr || classroom.name;

                return (
                  <option key={classroom.id} value={classroomValue}>
                    {classroomLabel}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("status")}
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as Student["status"],
                }))
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("enrollment_year")}
            </label>
            <select
              value={formData.enrollment_year}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, enrollment_year: e.target.value }))
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="">{t("select_enrollment_year")}</option>
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("created_at")}
            </label>
            <input
              type="text"
              value={new Date(
                student.created_at ?? student.submittedDate,
              ).toLocaleString()}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("contact_information")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("address")}
              </label>
              <input
                type="text"
                value={formData.address_line}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address_line: e.target.value }))
                }
                disabled={!isEditing}
                placeholder={t("address_placeholder")}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("city")}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                disabled={!isEditing}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("district")}
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, district: e.target.value }))
                }
                disabled={!isEditing}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
