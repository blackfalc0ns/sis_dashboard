"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Stepper from "@/features/admissions/shared/Stepper";
import StudentInfoStep from "./steps/StudentInfoStep";
import GuardianInfoStep from "./steps/GuardianInfoStep";
import DocumentsStep from "./steps/DocumentsStep";
import { Lead } from "@/features/admissions/leads/types/lead";
import { fetchAdmissionsDocumentRequirements } from "@/features/settings/services/settingsService";
import {
  fetchStructureTree,
  type Stage,
  type Grade,
  type Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import type { AdmissionsRequiredDocumentConfig } from "@/features/settings/types";
import type { ApplicationCreationPayload } from "@/features/admissions/applications/services/applicationCreationService";

interface ApplicationCreateStepperProps {
  lead?: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationCreationPayload) => void;
}

interface Guardian {
  full_name: string;
  relation: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  national_id: string;
  job_title: string;
  workplace: string;
  is_primary: boolean;
  can_pickup: boolean;
  can_receive_notifications: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

interface DocumentData {
  uploaded: boolean;
  file: File | null;
}

type DocumentsState = Record<string, DocumentData>;

const createEmptyDocumentState = (
  requirements: AdmissionsRequiredDocumentConfig[],
  currentDocuments: DocumentsState = {},
): DocumentsState =>
  requirements.reduce<DocumentsState>((accumulator, requirement) => {
    accumulator[requirement.id] = currentDocuments[requirement.id] || {
      uploaded: false,
      file: null,
    };
    return accumulator;
  }, {});

export default function ApplicationCreateStepper({
  lead,
  isOpen,
  onClose,
  onSubmit,
}: ApplicationCreateStepperProps) {
  const t = useTranslations("admissions.create_application");
  const composeFullName = (...parts: string[]) =>
    parts
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [guardianErrors, setGuardianErrors] = useState<ValidationErrors[]>([
    {},
  ]);
  const [guardians, setGuardians] = useState<Guardian[]>([
    {
      full_name: "",
      relation: "father",
      phone_primary: lead?.phone || "",
      phone_secondary: "",
      email: lead?.email || "",
      national_id: "",
      job_title: "",
      workplace: "",
      is_primary: true,
      can_pickup: true,
      can_receive_notifications: true,
    },
  ]);
  const [documentRequirements, setDocumentRequirements] = useState<
    AdmissionsRequiredDocumentConfig[]
  >([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const { yearId, termId } = useAdmissionsYearTermContext();
  const [formData, setFormData] = useState({
    first_name_ar: "",
    father_name_ar: "",
    grandfather_name_ar: "",
    family_name_ar: "",
    first_name_en: "",
    father_name_en: "",
    grandfather_name_en: "",
    family_name_en: "",
    gender: "",
    date_of_birth: "",
    nationality: "",
    stage: "",
    grade_requested: lead?.gradeInterest || "",
    section: "",
    address_line: "",
    city: "",
    district: "",
    previous_school: "",
    medical_conditions: "",
    notes: "",
    join_date: new Date().toISOString().split("T")[0],
    status: "pending",
    documents: {} as DocumentsState,
  });

  const activeDocumentRequirements = useMemo(
    () =>
      documentRequirements
        .filter((requirement) => requirement.active)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [documentRequirements],
  );

  const missingRequiredDocuments = useMemo(
    () =>
      activeDocumentRequirements.filter(
        (requirement) =>
          requirement.required && !formData.documents[requirement.id]?.uploaded,
      ),
    [activeDocumentRequirements, formData.documents],
  );

  const steps = [
    {
      label: t("steps.student_info"),
      description: t("steps.student_info_desc"),
    },
    {
      label: t("steps.guardian_info"),
      description: t("steps.guardian_info_desc"),
    },
    { label: t("steps.documents"), description: t("steps.documents_desc") },
  ];

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoadingDocuments(true);
    void fetchAdmissionsDocumentRequirements()
      .then((requirements) => {
        if (cancelled) return;
        setDocumentRequirements(requirements);
        setFormData((current) => ({
          ...current,
          documents: createEmptyDocumentState(
            requirements.filter((requirement) => requirement.active),
            current.documents,
          ),
        }));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDocuments(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !yearId || !termId) return;

    let cancelled = false;
    setIsLoadingStructure(true);
    void fetchStructureTree(yearId, termId)
      .then((data) => {
        if (cancelled) return;
        setStages(data.stages);
        setGrades(data.grades);
        setSections(data.sections);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load structure tree:", error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingStructure(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, yearId, termId]);

  if (!isOpen) return null;

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    const phoneRegex = /^[\d\s+()-]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  };

  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.first_name_ar.trim())
      newErrors.first_name_ar = t("errors.first_name_ar_required");
    if (!formData.father_name_ar.trim())
      newErrors.father_name_ar = t("errors.father_name_ar_required");
    if (!formData.grandfather_name_ar.trim())
      newErrors.grandfather_name_ar = t("errors.grandfather_name_ar_required");
    if (!formData.family_name_ar.trim())
      newErrors.family_name_ar = t("errors.family_name_ar_required");
    if (!formData.first_name_en.trim())
      newErrors.first_name_en = t("errors.first_name_en_required");
    if (!formData.father_name_en.trim())
      newErrors.father_name_en = t("errors.father_name_en_required");
    if (!formData.grandfather_name_en.trim())
      newErrors.grandfather_name_en = t("errors.grandfather_name_en_required");
    if (!formData.family_name_en.trim())
      newErrors.family_name_en = t("errors.family_name_en_required");
    if (!formData.gender) newErrors.gender = t("errors.gender_required");
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = t("errors.date_of_birth_required");
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 3 || age > 20) newErrors.date_of_birth = t("errors.age_range");
    }
    if (!formData.nationality)
      newErrors.nationality = t("errors.nationality_required");
    if (!formData.grade_requested)
      newErrors.grade_requested = t("errors.grade_required");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newGuardianErrors: ValidationErrors[] = [];
    let isValid = true;

    guardians.forEach((guardian, index) => {
      const guardianError: ValidationErrors = {};

      if (!guardian.full_name.trim()) {
        guardianError.full_name = t("errors.guardian_name_required");
        isValid = false;
      }
      if (!guardian.phone_primary.trim()) {
        guardianError.phone_primary = t("errors.phone_primary_required");
        isValid = false;
      } else if (!validatePhone(guardian.phone_primary)) {
        guardianError.phone_primary = t("errors.invalid_phone");
        isValid = false;
      }
      if (!guardian.email.trim()) {
        guardianError.email = t("errors.email_required");
        isValid = false;
      } else if (!validateEmail(guardian.email)) {
        guardianError.email = t("errors.invalid_email");
        isValid = false;
      }
      if (
        guardian.phone_secondary &&
        !validatePhone(guardian.phone_secondary)
      ) {
        guardianError.phone_secondary = t("errors.invalid_phone");
        isValid = false;
      }

      newGuardianErrors[index] = guardianError;
    });

    if (!guardians.some((guardian) => guardian.is_primary)) {
      newGuardianErrors[0] = {
        ...newGuardianErrors[0],
        is_primary: t("errors.primary_guardian_required"),
      };
      isValid = false;
    }

    setGuardianErrors(newGuardianErrors);
    return isValid;
  };

  const validateStep3 = (): boolean => {
    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors.documents;
      return nextErrors;
    });
    return true;
  };

  const handleFileUpload = (docKey: string, file: File | null) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        [docKey]: t("errors.file_type_error"),
      }));
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((current) => ({
        ...current,
        [docKey]: t("errors.file_size_error"),
      }));
      return;
    }

    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[docKey];
      delete nextErrors.documents;
      return nextErrors;
    });

    updateFormData("documents", {
      ...formData.documents,
      [docKey]: { uploaded: true, file },
    });
  };

  const handleFileRemove = (docKey: string) => {
    updateFormData("documents", {
      ...formData.documents,
      [docKey]: { uploaded: false, file: null },
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("border-primary", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-primary", "bg-blue-50");
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>, docKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-primary", "bg-blue-50");

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(docKey, files[0]);
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && !validateStep1()) return;
    if (currentStep === 1 && !validateStep2()) return;
    if (currentStep === 2 && !validateStep3()) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setErrors({});
      setGuardianErrors([{}]);
      return;
    }

    onSubmit({
      student: {
        first_name_ar: formData.first_name_ar,
        father_name_ar: formData.father_name_ar,
        grandfather_name_ar: formData.grandfather_name_ar,
        family_name_ar: formData.family_name_ar,
        first_name_en: formData.first_name_en,
        father_name_en: formData.father_name_en,
        grandfather_name_en: formData.grandfather_name_en,
        family_name_en: formData.family_name_en,
        full_name_ar: composeFullName(
          formData.first_name_ar,
          formData.father_name_ar,
          formData.grandfather_name_ar,
          formData.family_name_ar,
        ),
        full_name_en: composeFullName(
          formData.first_name_en,
          formData.father_name_en,
          formData.grandfather_name_en,
          formData.family_name_en,
        ),
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        nationality: formData.nationality,
        stage: formData.stage,
        grade_requested: formData.grade_requested,
        section: formData.section,
        address_line: formData.address_line,
        city: formData.city,
        district: formData.district,
        status: formData.status,
        join_date: formData.join_date,
        notes: formData.notes,
        previous_school: formData.previous_school,
        medical_conditions: formData.medical_conditions,
      },
      guardians,
      documents: activeDocumentRequirements.map((requirement) => {
        const documentState = formData.documents[requirement.id];
        return {
          configId: requirement.id,
          labelEn: requirement.nameEn,
          labelAr: requirement.nameAr,
          required: requirement.required,
          uploaded: Boolean(documentState?.uploaded),
          fileName: documentState?.file?.name,
        };
      }),
    });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      setGuardianErrors([{}]);
    }
  };

  const updateFormData = (field: string, value: unknown) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const updateGuardian = (index: number, field: string, value: unknown) => {
    const updatedGuardians = [...guardians];
    updatedGuardians[index] = { ...updatedGuardians[index], [field]: value };
    setGuardians(updatedGuardians);
    if (guardianErrors[index]?.[field]) {
      const newErrors = [...guardianErrors];
      delete newErrors[index][field];
      setGuardianErrors(newErrors);
    }
  };

  const addGuardian = () => {
    setGuardians([
      ...guardians,
      {
        full_name: "",
        relation: "mother",
        phone_primary: "",
        phone_secondary: "",
        email: "",
        national_id: "",
        job_title: "",
        workplace: "",
        is_primary: false,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ]);
    setGuardianErrors([...guardianErrors, {}]);
  };

  const removeGuardian = (index: number) => {
    if (guardians.length > 1) {
      setGuardians(guardians.filter((_, i) => i !== index));
      setGuardianErrors(guardianErrors.filter((_, i) => i !== index));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="xl"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      className="max-h-[90vh]"
    >
      <p className="mb-6 text-sm text-gray-500">{t("subtitle")}</p>

      <div className="mb-6">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>

      {currentStep === 0 && (
        <StudentInfoStep
          formData={formData}
          errors={errors}
          updateFormData={updateFormData}
          stages={stages}
          grades={grades}
          sections={sections}
          isLoadingStructure={isLoadingStructure}
        />
      )}

      {currentStep === 1 && (
        <GuardianInfoStep
          guardians={guardians}
          guardianErrors={guardianErrors}
          updateGuardian={updateGuardian}
          addGuardian={addGuardian}
          removeGuardian={removeGuardian}
          setGuardians={setGuardians}
          setGuardianErrors={setGuardianErrors}
        />
      )}

      {currentStep === 2 && (
        <DocumentsStep
          requirements={activeDocumentRequirements}
          documents={formData.documents}
          errors={errors}
          isLoading={isLoadingDocuments}
          missingRequiredDocuments={missingRequiredDocuments}
          handleFileUpload={handleFileUpload}
          handleFileRemove={handleFileRemove}
          handleDragOver={handleDragOver}
          handleDragEnter={handleDragEnter}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
        />
      )}

      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
        <button
          onClick={currentStep === 0 ? onClose : handleBack}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {currentStep === 0 ? t("buttons.cancel") : t("buttons.previous")}
        </button>
        <button
          onClick={handleNext}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-hover"
        >
          {currentStep === steps.length - 1
            ? t("buttons.submit")
            : t("buttons.next")}
        </button>
      </div>
    </Modal>
  );
}
