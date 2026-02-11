// FILE: src/components/admissions/ApplicationCreateStepper.tsx

"use client";

import { useState } from "react";
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
    { label: "Student Info", description: "Basic information" },
    { label: "Guardian Info", description: "Parent/Guardian details" },
    { label: "Documents", description: "Required documents" },
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
      newErrors.full_name_ar = "Arabic name is required";
    }
    if (!formData.full_name_en.trim()) {
      newErrors.full_name_en = "English name is required";
    }
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required";
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 3 || age > 20) {
        newErrors.date_of_birth = "Student age must be between 3 and 20 years";
      }
    }
    if (!formData.nationality.trim()) {
      newErrors.nationality = "Nationality is required";
    }
    if (!formData.grade_requested) {
      newErrors.grade_requested = "Grade is required";
    }
    if (formData.student_email && !validateEmail(formData.student_email)) {
      newErrors.student_email = "Invalid email format";
    }
    if (formData.student_phone && !validatePhone(formData.student_phone)) {
      newErrors.student_phone = "Invalid phone format (min 10 digits)";
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
        guardianError.full_name = "Guardian name is required";
        isValid = false;
      }
      if (!guardian.phone_primary.trim()) {
        guardianError.phone_primary = "Primary phone is required";
        isValid = false;
      } else if (!validatePhone(guardian.phone_primary)) {
        guardianError.phone_primary = "Invalid phone format (min 10 digits)";
        isValid = false;
      }
      if (!guardian.email.trim()) {
        guardianError.email = "Email is required";
        isValid = false;
      } else if (!validateEmail(guardian.email)) {
        guardianError.email = "Invalid email format";
        isValid = false;
      }
      if (
        guardian.phone_secondary &&
        !validatePhone(guardian.phone_secondary)
      ) {
        guardianError.phone_secondary = "Invalid phone format";
        isValid = false;
      }

      newGuardianErrors[index] = guardianError;
    });

    // Check if at least one guardian is primary
    const hasPrimary = guardians.some((g) => g.is_primary);
    if (!hasPrimary) {
      newGuardianErrors[0] = {
        ...newGuardianErrors[0],
        is_primary: "At least one guardian must be marked as primary",
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
      newErrors.documents = "At least one document must be uploaded";
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
          [docKey]: "Only PDF, JPG, and PNG files are allowed",
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors({
          ...errors,
          [docKey]: "File size must be less than 5MB",
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
            <h2 className="text-xl font-bold text-gray-900">
              Create Application
            </h2>
            <p className="text-sm text-gray-500">
              Fill in the required information
            </p>
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
                Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (Arabic) *
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
                    placeholder="أدخل اسم الطالب"
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
                    Full Name (English) *
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
                    placeholder="Enter student name"
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
                    Date of Birth *
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
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateFormData("gender", e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                      errors.gender ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
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
                    Nationality *
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
                    placeholder="Enter nationality"
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
                    Grade Requested *
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
                    <option value="">Select grade</option>
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
                    Address Line
                  </label>
                  <input
                    type="text"
                    value={formData.address_line}
                    onChange={(e) =>
                      updateFormData("address_line", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => updateFormData("district", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                    placeholder="District"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Phone
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
                    placeholder="+20 100 111 2223"
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
                    Student Email
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
                    placeholder="student@email.com"
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
                    Previous School
                  </label>
                  <input
                    type="text"
                    value={formData.previous_school}
                    onChange={(e) =>
                      updateFormData("previous_school", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                    placeholder="Enter previous school"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Conditions
                  </label>
                  <input
                    type="text"
                    value={formData.medical_conditions}
                    onChange={(e) =>
                      updateFormData("medical_conditions", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                    placeholder="Any medical conditions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date
                  </label>
                  <input
                    type="date"
                    value={formData.join_date}
                    onChange={(e) =>
                      updateFormData("join_date", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateFormData("notes", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm resize-none"
                    placeholder="Additional notes..."
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
                  Guardian Information
                </h3>
                <button
                  type="button"
                  onClick={addGuardian}
                  className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Guardian
                </button>
              </div>

              {guardians.map((guardian, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      Guardian {index + 1}
                      {guardian.is_primary && (
                        <span className="ml-2 text-xs bg-[#036b80] text-white px-2 py-1 rounded-full">
                          Primary
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
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
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
                        placeholder="Enter guardian name"
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
                        Relation *
                      </label>
                      <select
                        value={guardian.relation}
                        onChange={(e) =>
                          updateGuardian(index, "relation", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                      >
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Phone *
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
                        placeholder="+20 100 111 2223"
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
                        Secondary Phone
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
                        placeholder="+20 100 111 2224"
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
                        Email *
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
                        placeholder="guardian@email.com"
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
                        National ID
                      </label>
                      <input
                        type="text"
                        value={guardian.national_id}
                        onChange={(e) =>
                          updateGuardian(index, "national_id", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                        placeholder="National ID number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={guardian.job_title}
                        onChange={(e) =>
                          updateGuardian(index, "job_title", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                        placeholder="Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Workplace
                      </label>
                      <input
                        type="text"
                        value={guardian.workplace}
                        onChange={(e) =>
                          updateGuardian(index, "workplace", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                        placeholder="Company X"
                      />
                    </div>
                  </div>

                  {/* Guardian Permissions */}
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-medium text-gray-900 mb-3 text-sm">
                      Permissions
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
                          Primary Guardian
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
                          Can Pickup Student
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
                          Can Receive Notifications
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
                Required Documents
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload at least one document. Accepted formats: PDF, JPG, PNG
                (Max 5MB each)
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
                    label: "Birth Certificate",
                    required: true,
                  },
                  {
                    key: "passportCopy",
                    label: "Passport Copy",
                    required: false,
                  },
                  {
                    key: "medicalReport",
                    label: "Medical Report",
                    required: false,
                  },
                  {
                    key: "schoolCertificate",
                    label: "Previous School Certificate",
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
                            Remove
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
                            Click to upload or drag and drop
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
                  <strong>Note:</strong> Documents can be uploaded now or added
                  later from the Application 360 view. At least one document is
                  required to proceed.
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
            {currentStep === 0 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium text-sm transition-colors"
          >
            {currentStep === steps.length - 1 ? "Submit Application" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
