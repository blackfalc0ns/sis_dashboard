// FILE: src/components/students-guardians/profile-tabs/TransfersTab.tsx

"use client";

import { ArrowLeftRight } from "lucide-react";
import { Student } from "@/types/students";
import { useTranslations } from "next-intl";

interface TransfersTabProps {
  student: Student;
}

export default function TransfersTab({}: TransfersTabProps) {
  const t = useTranslations("students_guardians.profile.transfers");

  // TODO: Fetch actual transfer data from API
  // For now, showing empty state

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">{t("info_message")}</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl p-12 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <ArrowLeftRight className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("no_transfers")}
        </h3>
        <p className="text-sm text-gray-500 mb-6">{t("no_transfers_desc")}</p>
      </div>

      {/* Transfer History Section (for future use) */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {t("transfer_history")}
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">{t("no_history")}</p>
        </div>
      </div>
    </div>
  );
}
