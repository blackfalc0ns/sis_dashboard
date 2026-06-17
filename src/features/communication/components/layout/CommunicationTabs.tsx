"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import {
  BellRing,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type CommunicationTabKey =
  | "overview"
  | "conversations"
  | "announcements"
  | "notifications"
  | "safety"
  | "settings";

export interface CommunicationTabItem {
  key: CommunicationTabKey;
  labelEn: string;
  labelAr: string;
  href: string;
  icon: LucideIcon;
}

export interface CommunicationTabsProps {
  tabs?: CommunicationTabItem[];
  className?: string;
}

export const communicationTabs: CommunicationTabItem[] = [
  {
    key: "overview",
    labelEn: "Overview",
    labelAr: "نظرة عامة",
    href: "/communication",
    icon: LayoutDashboard,
  },
  {
    key: "conversations",
    labelEn: "Conversations",
    labelAr: "المحادثات",
    href: "/communication/conversations",
    icon: MessageSquare,
  },
  {
    key: "announcements",
    labelEn: "Announcements",
    labelAr: "الإعلانات",
    href: "/communication/announcements",
    icon: BellRing,
  },
  {
    key: "notifications",
    labelEn: "Notifications",
    labelAr: "الإشعارات",
    href: "/communication/notifications",
    icon: BellRing,
  },
  {
    key: "safety",
    labelEn: "Safety",
    labelAr: "الأمان",
    href: "/communication/moderation",
    icon: ShieldCheck,
  },
  {
    key: "settings",
    labelEn: "Settings",
    labelAr: "الإعدادات",
    href: "/communication/settings",
    icon: Settings,
  },
];

function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CommunicationTabs({
  tabs = communicationTabs,
  className = "",
}: CommunicationTabsProps) {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label="Communication sections"
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const localizedHref = `/${locale}${tab.href}`;
        const isActive = isTabActive(pathname, localizedHref);
        const label = locale === "ar" ? tab.labelAr : tab.labelEn;

        return (
          <Link
            key={tab.key}
            href={localizedHref}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
