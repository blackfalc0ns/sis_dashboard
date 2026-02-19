// FILE: src/components/admissions/ApplicationCreateStepper.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Stepper from "../shared/Stepper";
import StudentInfoStep from "./steps/StudentInfoStep";
import GuardianInfoStep from "./steps/GuardianInfoStep";
import DocumentsStep from "./steps/DocumentsStep";
import { Lead } from "@/types/leads";

interface ApplicationCreateStepperProps {
  lead?: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
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

export default function ApplicationCreateStepper({
  lead,
  isOpen,
  onClose,
  onSubmit,
}: ApplicationCreateStepperProps) {
  const t = useTranslations("admissions.create_application");
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
  const [formData, setFormData] = useState({
    // Step 1: Student Info
    full_name_ar: lead?.name || "",
    full_name_en: "",
    gender: "",
    date_of_birth: "",
    nationality: "",
    stage: "",
    address_line: "",
    city: "",
    district: "",
    student_phone: "",
    student_email: "",
    grade_requested: lead?.gradeInterest || "",
    previous_school: "",
    medical_conditions: "",
    notes: "",
    join_date: new Date().toISOString().split("T")[0],
    status: "pending",
    // Step 3: Documents
    documents: {
      birthCertificate: { uploaded: false, file: null as File | null },
      passportCopy: { uploaded: false, file: null as File | null },
      medicalReport: { uploaded: false, file: null as File | null },
      schoolCertificate: { uploaded: false, file: null as File | null },
    },
  });

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

  if (!isOpen) return null;

  // Validation functions
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

    if (!formData.full_name_ar.trim()) {
      newErrors.full_name_ar = t("errors.full_name_ar_required");
    }
    if (!formData.full_name_en.trim()) {
      newErrors.full_name_en = t("errors.full_name_en_required");
    }
    if (!formData.gender) {
      newErrors.gender = t("errors.gender_required");
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = t("errors.date_of_birth_required");
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 3 || age > 20) {
        newErrors.date_of_birth = t("errors.age_range");
      }
    }
    if (!formData.nationality.trim()) {
      newErrors.nationality = t("errors.nationality_required");
    }
    if (!formData.grade_requested) {
      newErrors.grade_requested = t("errors.grade_required");
    }
    if (formData.student_email && !validateEmail(formData.student_email)) {
      newErrors.student_email = t("errors.invalid_email");
    }
    if (formData.student_phone && !validatePhone(formData.student_phone)) {
      newErrors.student_phone = t("errors.invalid_phone");
    }

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

    const hasPrimary = guardians.some((g) => g.is_primary);
    if (!hasPrimary) {
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
    const newErrors: ValidationErrors = {};

    const hasAnyDocument = Object.values(formData.documents).some(
      (doc) => doc.uploaded,
    );

    if (!hasAnyDocument) {
      newErrors.documents = t("errors.document_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (docKey: string, file: File | null) => {
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors({
          ...errors,
          [docKey]: t("errors.file_type_error"),
        });
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors({
          ...errors,
          [docKey]: t("errors.file_size_error"),
        });
        return;
      }

      const newErrors = { ...errors };
      delete newErrors[docKey];
      delete newErrors.documents;
      setErrors(newErrors);

      updateFormData("documents", {
        ...formData.documents,
        [docKey]: { uploaded: true, file: file },
      });
    }
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
    if (currentStep === 0 && !validateStep1()) {
      return;
    }
    if (currentStep === 1 && !validateStep2()) {
      return;
    }
    if (currentStep === 2 && !validateStep3()) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setErrors({});
      setGuardianErrors([{}]);
    } else {
      const submissionData = {
        student: {
          full_name_ar: formData.full_name_ar,
          full_name_en: formData.full_name_en,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          nationality: formData.nationality,
          stage: formData.stage,
          address_line: formData.address_line,
          city: formData.city,
          district: formData.district,
          student_phone: formData.student_phone,
          email: formData.student_email,
          status: formData.status,
          join_date: formData.join_date,
          grade_requested: formData.grade_requested,
          notes: formData.notes,
          previous_school: formData.previous_school,
          medical_conditions: formData.medical_conditions,
        },
        guardians: guardians,
        documents: {
          birthCertificate: formData.documents.birthCertificate.uploaded,
          passportCopy: formData.documents.passportCopy.uploaded,
          medicalReport: formData.documents.medicalReport.uploaded,
          schoolCertificate: formData.documents.schoolCertificate.uploaded,
        },
      };
      onSubmit(submissionData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      setGuardianErrors([{}]);
    }
  };

  const updateFormData = (field: string, value: unknown) => {
    setFormData({ ...formData, [field]: value });
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
      <p className="text-sm text-gray-500 mb-6">{t("subtitle")}</p>

      <div className="mb-6">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>

      {currentStep === 0 && (
        <StudentInfoStep
          formData={formData}
          errors={errors}
          updateFormData={updateFormData}
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
          documents={formData.documents}
          errors={errors}
          handleFileUpload={handleFileUpload}
          handleFileRemove={handleFileRemove}
          handleDragOver={handleDragOver}
          handleDragEnter={handleDragEnter}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
        />
      )}

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={currentStep === 0 ? onClose : handleBack}
          className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
        >
          {currentStep === 0 ? t("buttons.cancel") : t("buttons.previous")}
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium text-sm transition-colors"
        >
          {currentStep === steps.length - 1
            ? t("buttons.submit")
            : t("buttons.next")}
        </button>
      </div>
    </Modal>
  );
}
