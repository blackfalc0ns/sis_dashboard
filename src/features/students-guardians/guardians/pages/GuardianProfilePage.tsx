// FILE: src/components/students-guardians/GuardianProfilePage.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  Phone,
  Mail,
  Star,
} from "lucide-react";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import type { StudentGuardian } from "@/features/students-guardians/students/types";
import OverviewTab from "@/features/students-guardians/guardians/components/tabs/OverviewTab";
import StudentsTab from "@/features/students-guardians/guardians/components/tabs/StudentsTab";
import MainLoader from "@/components/ui/loaders/MainLoader";

interface GuardianProfilePageProps {
  guardianId: string;
}

type TabKey = "overview" | "students" | "documents" | "notes" | "timeline";

const tabs = [
  { key: "overview" as TabKey, labelKey: "tabs.overview", icon: User },
  { key: "students" as TabKey, labelKey: "tabs.students", icon: Users },
];

const getRelationColor = (relation: string) => {
  const colors: Record<string, string> = {
    father: "bg-blue-100 text-blue-700",
    mother: "bg-pink-100 text-pink-700",
    guardian: "bg-purple-100 text-purple-700",
    other: "bg-gray-100 text-gray-700",
  };
  return colors[relation.toLowerCase()] || colors.other;
};

export default function GuardianProfilePage({
  guardianId,
}: GuardianProfilePageProps) {
  const t = useTranslations("students_guardians.guardian_profile");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [guardian, setGuardian] = useState<StudentGuardian | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      try {
        const guardianData = await studentsService.fetchGuardianById(guardianId);
        if (!isCancelled) {
          setGuardian(guardianData ?? null);
          setLoadError(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setGuardian(null);
          setLoadError(
            error instanceof Error ? error.message : t("guardian_not_found"),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [guardianId, t]);

  if (isLoading) {
    return <MainLoader />;
  }

  if (!guardian) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-4">
            {loadError || t("guardian_not_found")}
          </p>
          <button
            onClick={() => router.push(`/${lang}/students-guardians/guardians`)}
            className="text-primary hover:text-hover font-medium"
          >
            {t("back_to_guardians")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4 sm:p-6">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/${lang}/students-guardians/guardians`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            {locale === "ar" ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {t("back_to_guardians")}
            </span>
          </button>

          {/* Guardian Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary to-hover flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {guardian.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {guardian.full_name}
                </h1>
                <div className="flex items-center gap-2">
                  {guardian.is_primary && (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  )}
                  <span
                    className={`w-fit inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRelationColor(guardian.relation)}`}
                  >
                    {guardian.relation.charAt(0).toUpperCase() +
                      guardian.relation.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{t("guardian_id")}:</span>{" "}
                  {guardian.guardianId}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {guardian.phone_primary}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {guardian.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max px-4 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {activeTab === "overview" && <OverviewTab guardian={guardian} />}
        {activeTab === "students" && <StudentsTab guardian={guardian} />}
      </div>
    </div>
  );
}
