"use client";

import { useMemo } from "react";
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
import { useSectionTabs } from "@/hooks/useSectionTabs";
import { buildLocalePath } from "@/lib/routing/localePath";

const tabs = [
  { key: "overview", labelKey: "tabs.overview", icon: User },
  { key: "students", labelKey: "tabs.students", icon: Users },
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

export default function GuardianProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("students_guardians.guardian_profile");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";

  const { activeTab, entityId: guardianId, handleTabClick } = useSectionTabs({
    basePath: ["students-guardians", "guardians"],
    idParam: "guardianId",
    tabs,
  });

  const guardian = useMemo(() => {
    return studentsService
      .getAllGuardians()
      .find((g) => g.guardianId === guardianId);
  }, [guardianId]);

  if (!guardian) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">{t("guardian_not_found")}</p>
          <button
            onClick={() => router.push(buildLocalePath(lang, "students-guardians", "guardians"))}
            className="mt-4 text-[#036b80] hover:underline"
          >
            {t("back_to_guardians")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(buildLocalePath(lang, "students-guardians", "guardians"))}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          {locale === "ar" ? (
            <ArrowRight className="w-5 h-5" />
          ) : (
            <ArrowLeft className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{t("back_to_guardians")}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#036b80] to-[#024d5c] flex items-center justify-center text-white font-bold text-xl shrink-0">
              {guardian.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {guardian.full_name}
                </h1>
                {guardian.is_primary && (
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600">
                <span>
                  {t("guardian_id")}: {guardian.guardianId}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRelationColor(guardian.relation)}`}
                >
                  {guardian.relation.charAt(0).toUpperCase() +
                    guardian.relation.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{guardian.phone_primary}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{guardian.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-[#036b80] text-[#036b80]"
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
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
