// FILE: src/components/admissions/ScheduleTestModal.tsx

"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

interface ScheduleTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    studentName: string;
    guardianName: string;
    guardianPhone: string;
    type: string;
    subject: string;
    date: string;
    time: string;
    duration: string;
    location: string;
    proctor: string;
    proctorPhone: string;
    notes: string;
  }) => void;
  studentName: string;
  guardianName?: string;
  guardianPhone?: string;
}

export default function ScheduleTestModal({
  isOpen,
  onClose,
  onSubmit,
  studentName,
  guardianName = "",
  guardianPhone = "",
}: ScheduleTestModalProps) {
  const t = useTranslations("admissions.schedule_test");
  const [formData, setFormData] = useState({
    studentName: studentName,
    guardianName: guardianName,
    guardianPhone: guardianPhone,
    type: "Placement Test",
    subject: "",
    date: "",
    time: "",
    duration: "60",
    location: "",
    proctor: "",
    proctorPhone: "",
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500">
              {t("student")}: {studentName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Student and Guardian Information */}
          <div className="bg-gray-50 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("student_guardian_info")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("student_name")} *
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData({ ...formData, studentName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("guardian_name")}
                </label>
                <input
                  type="text"
                  value={formData.guardianName}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder={t("guardian_name_placeholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("guardian_phone")}
                </label>
                <input
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianPhone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder={t("guardian_phone_placeholder")}
                />
              </div>
            </div>
          </div>

          {/* Test Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("test_details")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("subject")} *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required
                >
                  <option value="">{t("select_subject")}</option>
                  <option value="General">{t("general")}</option>
                  <option value="Mathematics">{t("mathematics")}</option>
                  <option value="English">{t("english")}</option>
                  <option value="Arabic">{t("arabic")}</option>
                  <option value="Science">{t("science")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("date")} *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("time")} *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("duration")}
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="30">{t("minutes", { count: 30 })}</option>
                  <option value="60">{t("minutes", { count: 60 })}</option>
                  <option value="90">{t("minutes", { count: 90 })}</option>
                  <option value="120">{t("minutes", { count: 120 })}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("location")} *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder={t("location_placeholder")}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("proctor")}
                </label>
                <input
                  type="text"
                  value={formData.proctor}
                  onChange={(e) =>
                    setFormData({ ...formData, proctor: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder={t("proctor_placeholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("proctor_phone")}
                </label>
                <input
                  type="tel"
                  value={formData.proctorPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, proctorPhone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder={t("proctor_phone_placeholder")}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("notes")}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
              placeholder={t("notes_placeholder")}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium text-sm transition-colors"
            >
              {t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
