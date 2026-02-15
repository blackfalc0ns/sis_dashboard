// FILE: src/components/admissions/ApplicationCreateStepper.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Upload,
  FileCheck,
  FileX,
} from "lucide-react";
import Stepper from "./Stepper";
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
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional unless required
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

    // Check if at least one guardian is primary
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

    // Check if at least one required document is uploaded
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
      // Validate file type
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

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors({
          ...errors,
          [docKey]: t("errors.file_size_error"),
        });
        return;
      }

      // Clear any previous errors
      const newErrors = { ...errors };
      delete newErrors[docKey];
      delete newErrors.documents;
      setErrors(newErrors);

      // Update document state
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
    e.currentTarget.classList.add("border-[#036b80]", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-[#036b80]", "bg-blue-50");
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>, docKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-[#036b80]", "bg-blue-50");

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(docKey, files[0]);
    }
  };

  const handleNext = () => {
    // Validate current step
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
      // Format data to match API structure
      const submissionData = {
        student: {
          full_name_ar: formData.full_name_ar,
          full_name_en: formData.full_name_en,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          nationality: formData.nationality,
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
    // Clear error for this field
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
    // Clear error for this field
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Form Content */}
        <div className="px-6 pb-6">
          {/* STEP 1: Student Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                {t("student.title")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.full_name_ar")} *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name_ar}
                    onChange={(e) =>
                      updateFormData("full_name_ar", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                      errors.full_name_ar ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder={t("student.full_name_ar_placeholder")}
                    dir="rtl"
                  />
                  {errors.full_name_ar && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.full_name_ar}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.full_name_en")} *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name_en}
                    onChange={(e) =>
                      updateFormData("full_name_en", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                      errors.full_name_en ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder={t("student.full_name_en_placeholder")}
                  />
                  {errors.full_name_en && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.full_name_en}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.date_of_birth")} *
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      updateFormData("date_of_birth", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                      errors.date_of_birth
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  />
                  {errors.date_of_birth && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.date_of_birth}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.gender")} *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateFormData("gender", e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                      errors.gender ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="">{t("student.grade_placeholder")}</option>
                    <option value="male">{t("student.male")}</option>
                    <option value="female">{t("student.female")}</option>
                  </select>
                  {errors.gender && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.gender}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.nationality")} *
                  </label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) =>
                      updateFormData("nationality", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                      errors.nationality ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder={t("student.nationality_placeholder")}
                  />
                  {errors.nationality && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.nationality}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.grade_requested")} *
                  </label>
                  <select
                    value={formData.grade_requested}
                    onChange={(e) =>
                      updateFormData("grade_requested", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                      errors.grade_requested
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  >
                    <option value="">{t("student.grade_placeholder")}</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                      <option key={grade} value={grade.toString()}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                  {errors.grade_requested && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.grade_requested}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.address_line")}
                  </label>
                  <input
                    type="text"
                    value={formData.address_line}
                    onChange={(e) =>
                      updateFormData("address_line", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                    placeholder={t("student.address_placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.city")}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                    placeholder={t("student.city_placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.district")}
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => updateFormData("district", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                    placeholder={t("student.district_placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.student_phone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.student_phone}
                    onChange={(e) =>
                      updateFormData("student_phone", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                      errors.student_phone
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                    placeholder={t("guardian.phone_primary_placeholder")}
                  />
                  {errors.student_phone && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.student_phone}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.student_email")}
                  </label>
                  <input
                    type="email"
                    value={formData.student_email}
                    onChange={(e) =>
                      updateFormData("student_email", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                      errors.student_email
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                    placeholder={t("guardian.email_placeholder")}
                  />
                  {errors.student_email && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.student_email}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.previous_school")}
                  </label>
                  <input
                    type="text"
                    value={formData.previous_school}
                    onChange={(e) =>
                      updateFormData("previous_school", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                    placeholder={t("student.previous_school_placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.medical_conditions")}
                  </label>
                  <input
                    type="text"
                    value={formData.medical_conditions}
                    onChange={(e) =>
                      updateFormData("medical_conditions", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                    placeholder={t("student.medical_placeholder")}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("student.notes")}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateFormData("notes", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm resize-none"
                    placeholder={t("student.notes_placeholder")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Guardian Info - Multiple Guardians */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {t("guardian.title")}
                </h3>
                <button
                  type="button"
                  onClick={addGuardian}
                  className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t("buttons.add_guardian")}
                </button>
              </div>

              {guardians.map((guardian, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {t("guardian.title")} {index + 1}
                      {guardian.is_primary && (
                        <span className="ml-2 text-xs bg-[#036b80] text-white px-2 py-1 rounded-full">
                          {t("guardian.is_primary")}
                        </span>
                      )}
                    </h4>
                    {guardians.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGuardian(index)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t("buttons.remove_guardian")}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("guardian.full_name")} *
                      </label>
                      <input
                        type="text"
                        value={guardian.full_name}
                        onChange={(e) =>
                          updateGuardian(index, "full_name", e.target.value)
                        }
                        className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                          guardianErrors[index]?.full_name
                            ? "border-red-500"
                            : "border-gray-200"
                        }`}
                        placeholder={t("guardian.full_name_placeholder")}
                      />
                      {guardianErrors[index]?.full_name && (
                        <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>{guardianErrors[index].full_name}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("guardian.relation")} *
                      </label>
                      <select
                        value={guardian.relation}
                        onChange={(e) =>
                          updateGuardian(index, "relation", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                      >
                        <option value="father">{t("guardian.father")}</option>
                        <option value="mother">{t("guardian.mother")}</option>
                        <option value="guardian">{t("guardian.other")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("guardian.phone_primary")} *
                      </label>
                      <input
                        type="tel"
                        value={guardian.phone_primary}
                        onChange={(e) =>
                          updateGuardian(index, "phone_primary", e.target.value)
                        }
                        className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                          guardianErrors[index]?.phone_primary
                            ? "border-red-500"
                            : "border-gray-200"
                        }`}
                        placeholder={t("guardian.phone_primary_placeholder")}
                      />
                      {guardianErrors[index]?.phone_primary && (
                        <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>{guardianErrors[index].phone_primary}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("guardian.phone_secondary")}
                      </label>
                      <input
                        type="tel"
                        value={guardian.phone_secondary}
                        onChange={(e) =>
                          updateGuardian(
                            index,
                            "phone_secondary",
                            e.target.value,
                          )
                        }
                        className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                          guardianErrors[index]?.phone_secondary
                            ? "border-red-500"
                            : "border-gray-200"
                        }`}
                        placeholder={t("guardian.phone_primary_placeholder")}
                      />
                      {guardianErrors[index]?.phone_secondary && (
                        <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>{guardianErrors[index].phone_secondary}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("guardian.email")} *
                      </label>
                      <input
                        type="email"
                        value={guardian.email}
                        onChange={(e) =>
                          updateGuardian(index, "email", e.target.value)
                        }
                        className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                          guardianErrors[index]?.email
                            ? "border-red-500"
                            : "border-gray-200"
                        }`}
                        placeholder={t("guardian.email_placeholder")}
                      />
                      {guardianErrors[index]?.email && (
                        <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>{guardianErrors[index].email}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("guardian.national_id")}
                      </label>
                      <input
                        type="text"
                        value={guardian.national_id}
                        onChange={(e) =>
                          updateGuardian(index, "national_id", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                        placeholder={t("guardian.national_id_placeholder")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("guardian.job_title")}
                      </label>
                      <input
                        type="text"
                        value={guardian.job_title}
                        onChange={(e) =>
                          updateGuardian(index, "job_title", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                        placeholder={t("guardian.job_title_placeholder")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("guardian.workplace")}
                      </label>
                      <input
                        type="text"
                        value={guardian.workplace}
                        onChange={(e) =>
                          updateGuardian(index, "workplace", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                        placeholder={t("guardian.workplace_placeholder")}
                      />
                    </div>
                  </div>

                  {/* Guardian Permissions */}
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-medium text-gray-900 mb-3 text-sm">
                      {t("guardian.permissions")}
                    </h5>
                    {guardianErrors[index]?.is_primary && (
                      <div className="flex items-center gap-1 mb-2 text-red-600 text-xs bg-red-50 p-2 rounded">
                        <AlertCircle className="w-3 h-3" />
                        <span>{guardianErrors[index].is_primary}</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={guardian.is_primary}
                          onChange={(e) => {
                            // If setting as primary, unset all others
                            if (e.target.checked) {
                              const updatedGuardians = guardians.map(
                                (g, i) => ({
                                  ...g,
                                  is_primary: i === index,
                                }),
                              );
                              setGuardians(updatedGuardians);
                              // Clear primary error
                              const newErrors = [...guardianErrors];
                              guardians.forEach((_, i) => {
                                if (newErrors[i]?.is_primary) {
                                  delete newErrors[i].is_primary;
                                }
                              });
                              setGuardianErrors(newErrors);
                            } else {
                              updateGuardian(index, "is_primary", false);
                            }
                          }}
                          className="w-4 h-4 text-[#036b80] border-gray-300 rounded focus:ring-[#036b80]"
                        />
                        <span className="text-sm text-gray-700">
                          {t("guardian.is_primary")}
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={guardian.can_pickup}
                          onChange={(e) =>
                            updateGuardian(
                              index,
                              "can_pickup",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 text-[#036b80] border-gray-300 rounded focus:ring-[#036b80]"
                        />
                        <span className="text-sm text-gray-700">
                          {t("guardian.can_pickup")}
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={guardian.can_receive_notifications}
                          onChange={(e) =>
                            updateGuardian(
                              index,
                              "can_receive_notifications",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 text-[#036b80] border-gray-300 rounded focus:ring-[#036b80]"
                        />
                        <span className="text-sm text-gray-700">
                          {t("guardian.can_receive_notifications")}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: Documents */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                {t("documents.title")}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t("documents.subtitle")} - {t("documents.file_types")}
              </p>

              {errors.documents && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.documents}</span>
                </div>
              )}

              <div className="space-y-3">
                {[
                  {
                    key: "birthCertificate",
                    label: t("documents.birth_certificate"),
                    required: true,
                  },
                  {
                    key: "passportCopy",
                    label: t("documents.passport_copy"),
                    required: false,
                  },
                  {
                    key: "medicalReport",
                    label: t("documents.medical_report"),
                    required: false,
                  },
                  {
                    key: "schoolCertificate",
                    label: t("documents.school_certificate"),
                    required: false,
                  },
                ].map((doc) => {
                  const docData =
                    formData.documents[
                      doc.key as keyof typeof formData.documents
                    ];
                  const hasError = errors[doc.key];

                  return (
                    <div
                      key={doc.key}
                      className={`p-4 border rounded-lg ${
                        hasError
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {doc.label}
                            {doc.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </span>
                          {docData.uploaded && (
                            <FileCheck className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        {docData.uploaded ? (
                          <button
                            type="button"
                            onClick={() => handleFileRemove(doc.key)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-medium"
                          >
                            <FileX className="w-4 h-4" />
                            {t("documents.remove")}
                          </button>
                        ) : null}
                      </div>

                      {docData.uploaded ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileCheck className="w-4 h-4 text-green-600" />
                          <span className="font-medium">
                            {docData.file?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(docData.file?.size || 0 / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                      ) : (
                        <label
                          className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#036b80] hover:bg-gray-50 cursor-pointer transition-colors"
                          onDragOver={handleDragOver}
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, doc.key)}
                        >
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {t("documents.drag_drop")}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(doc.key, file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}

                      {hasError && (
                        <div className="flex items-center gap-1 mt-2 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>{hasError}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  {t("documents.subtitle")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={currentStep === 0 ? onClose : handleBack}
            className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            {currentStep === 0 ? t("buttons.cancel") : t("buttons.previous")}
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium text-sm transition-colors"
          >
            {currentStep === steps.length - 1
              ? t("buttons.submit")
              : t("buttons.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
