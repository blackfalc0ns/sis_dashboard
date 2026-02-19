"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, Upload, FileCheck, FileX } from "lucide-react";

interface DocumentData {
  uploaded: boolean;
  file: File | null;
}

interface DocumentsStepProps {
  documents: {
    birthCertificate: DocumentData;
    passportCopy: DocumentData;
    medicalReport: DocumentData;
    schoolCertificate: DocumentData;
  };
  errors: Record<string, string>;
  handleFileUpload: (docKey: string, file: File | null) => void;
  handleFileRemove: (docKey: string) => void;
  handleDragOver: (e: React.DragEvent<HTMLLabelElement>) => void;
  handleDragEnter: (e: React.DragEvent<HTMLLabelElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLLabelElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLLabelElement>, docKey: string) => void;
}

export default function DocumentsStep({
  documents,
  errors,
  handleFileUpload,
  handleFileRemove,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
}: DocumentsStepProps) {
  const t = useTranslations("admissions.create_application");

  const documentsList = [
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
  ];

  return (
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
        {documentsList.map((doc) => {
          const docData = documents[doc.key as keyof typeof documents];
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
                  <span className="font-medium">{docData.file?.name}</span>
                  <span className="text-xs text-gray-500">
                    ({((docData.file?.size || 0) / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <label
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-gray-50 cursor-pointer transition-colors"
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
        <p className="text-xs text-blue-800">{t("documents.subtitle")}</p>
      </div>
    </div>
  );
}
