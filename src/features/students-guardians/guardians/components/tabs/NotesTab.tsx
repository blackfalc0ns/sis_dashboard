// FILE: src/components/students-guardians/guardian-tabs/NotesTab.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare, Plus } from "lucide-react";
import type { StudentGuardian } from "@/features/students-guardians/students/types";

interface NotesTabProps {
  guardian: StudentGuardian;
}

export default function NotesTab({}: NotesTabProps) {
  const t = useTranslations("students_guardians.guardian_profile");
  const [notes] = useState<never[]>([]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {t("sections.notes")}
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notes available</p>
            <p className="text-sm text-gray-400 mt-2">
              Add notes about this guardian
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Notes list will be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
}
