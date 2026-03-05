// FILE: src/components/students-guardians/guardian-tabs/TimelineTab.tsx

"use client";

import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import type { StudentGuardian } from "@/features/students-guardians/students/types";

interface TimelineTabProps {
  guardian: StudentGuardian;
}

export default function TimelineTab({}: TimelineTabProps) {
  const t = useTranslations("students_guardians.guardian_profile");

  // TODO: Implement timeline events fetching from service
  const events: never[] = [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          {t("sections.timeline")}
        </h2>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No timeline events</p>
            <p className="text-sm text-gray-400 mt-2">
              Activity history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline events will be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
}
