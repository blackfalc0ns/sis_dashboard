"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Video, ClipboardList } from "lucide-react";
import LessonMaterials from "./LessonMaterials";
import LessonVideo from "./LessonVideo";
import LessonAssignments from "./LessonAssignments";

interface LearningContentProps {
  lessonId: string;
  isReadOnly: boolean;
  gradeId?: string; // For scope-aware holiday checking in assignments
}

type TabType = "materials" | "video" | "assignments";

export default function LearningContent({ lessonId, isReadOnly, gradeId }: LearningContentProps) {
  const t = useTranslations("academics.curriculum.learningContent");
  const [activeTab, setActiveTab] = useState<TabType>("materials");

  const tabs = [
    { id: "materials" as TabType, label: t("materials"), icon: FileText },
    { id: "video" as TabType, label: t("video"), icon: Video },
    { id: "assignments" as TabType, label: t("assignments"), icon: ClipboardList },
  ];

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm border border-border">
      <div className="border-b border-border">
        <div className="px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{t("title")}</h3>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                  border-b-2 transition-colors
                  ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "materials" && (
          <LessonMaterials lessonId={lessonId} isReadOnly={isReadOnly} />
        )}
        {activeTab === "video" && (
          <LessonVideo lessonId={lessonId} isReadOnly={isReadOnly} />
        )}
        {activeTab === "assignments" && (
          <LessonAssignments lessonId={lessonId} isReadOnly={isReadOnly} gradeId={gradeId} />
        )}
      </div>
    </div>
  );
}
