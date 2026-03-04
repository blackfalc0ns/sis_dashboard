"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, FileText, Video, ClipboardList } from "lucide-react";
import { Drawer, IconButton, useMediaQuery, useTheme } from "@mui/material";
import LessonMaterials from "./LessonMaterials";
import LessonVideo from "./LessonVideo";
import LessonAssignments from "./LessonAssignments";

interface LearningContentPanelProps {
  lessonId: string;
  isReadOnly: boolean;
  gradeId?: string;
  open: boolean;
  onClose: () => void;
  defaultTab?: "materials" | "video" | "assignments";
}

type TabType = "materials" | "video" | "assignments";

export default function LearningContentPanel({
  lessonId,
  isReadOnly,
  gradeId,
  open,
  onClose,
  defaultTab = "materials",
}: LearningContentPanelProps) {
  const t = useTranslations("academics.curriculum.learningContent");
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isRTL = locale === "ar";

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const tabs = [
    { id: "materials" as TabType, label: t("materials"), icon: FileText },
    { id: "video" as TabType, label: t("video"), icon: Video },
    { id: "assignments" as TabType, label: t("assignments"), icon: ClipboardList },
  ];

  // Determine anchor based on screen size and RTL
  const anchor = isMobile ? "bottom" : isRTL ? "left" : "right";

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? "100%" : 480,
            maxWidth: "100%",
            height: isMobile ? "90vh" : "100%",
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
          },
        },
      }}
    >
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          <IconButton size="small" onClick={onClose} title={t("close")}>
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-border">
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
        <div className="flex-1 overflow-y-auto p-6">
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
    </Drawer>
  );
}
