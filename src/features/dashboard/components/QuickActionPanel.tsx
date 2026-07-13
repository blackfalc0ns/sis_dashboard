"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ClipboardCheck,
  FileText,
  Megaphone,
  Printer,
  Upload,
  UserPlus,
} from "lucide-react";
import { useMemo } from "react";
import DashboardAnnouncementDraftForm from "@/features/dashboard/components/DashboardAnnouncementDraftForm";
import type { DashboardAnnouncementLocale } from "@/features/dashboard/utils/dashboardAnnouncementLabels";

type QuickAction = {
  id: string;
  href: string;
  icon: typeof UserPlus;
  label: string;
  color: string;
};

export default function QuickActionPanel() {
  const locale = useLocale() as DashboardAnnouncementLocale;
  const t = useTranslations("quick_actions");
  const quickActions = useMemo(
    () => createQuickActions(locale, t),
    [locale, t],
  );

  return (
    <aside className="h-full rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-5 text-base font-bold text-gray-900">{t("title")}</h3>
      <QuickActionLinks actions={quickActions} />
      <DashboardAnnouncementDraftForm
        locale={locale}
        notificationTitle={t("notification_center")}
      />
    </aside>
  );
}

function QuickActionLinks({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.id}
            href={action.href}
            className="group flex items-center gap-2 rounded-lg px-3 py-2.5 text-lg font-medium transition-all hover:scale-105 hover:shadow-md"
            style={{
              backgroundColor: action.color,
              borderColor: action.color,
              borderWidth: 2,
            }}
          >
            <Icon className="h-4 w-4 text-white transition-colors" />
            <span className="text-sm font-black text-white transition-colors">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function createQuickActions(
  locale: string,
  t: ReturnType<typeof useTranslations>,
): QuickAction[] {
  return [
    {
      id: "add_student",
      icon: UserPlus,
      label: t("add_student"),
      href: `/${locale}/students-guardians/registration`,
      color: "#0ac5b2",
    },
    {
      id: "attendance",
      icon: ClipboardCheck,
      label: t("attendance"),
      href: `/${locale}/attendance/roll-call`,
      color: "#D93030",
    },
    {
      id: "announcement",
      icon: Megaphone,
      label: t("announcement"),
      href: `/${locale}/communication/announcements`,
      color: "#37A465",
    },
    {
      id: "assessment",
      icon: FileText,
      label: t("assessment"),
      href: `/${locale}/grades/assessments/new`,
      color: "#025a6b",
    },
  ];
}
