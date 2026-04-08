"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { heroJourneyTabs } from "../config/heroJourneyTabs";

interface HeroJourneyPageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  bannerImageSrc?: string;
}

export default function HeroJourneyPageHeader({
  title,
  description,
  actions,
  bannerImageSrc = "/assets/hero-journey/banner-map.svg",
}: HeroJourneyPageHeaderProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("heroJourney");

  return (
    <div className="space-y-4">
      <div
        className="relative min-h-[200px] bg-slate-900 bg-cover bg-center bg-no-repeat rounded-2xl"
        style={{
          backgroundImage: `linear-gradient(${locale === "ar" ? "-90deg" : "90deg"}, rgba(15, 23, 42,0.5) 0%, rgba(15, 23, 42, 0.38) 42%, rgba(15, 23, 42, 0.1) 100%), url('${bannerImageSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_18%),radial-gradient(circle_at_88%_22%,rgba(255,255,255,0.35),transparent_9%)]" />
        <div className="relative flex min-h-[180px] items-end px-5 py-5 sm:px-7">
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-100">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-5 px-5 py-5 sm:px-7 justify-between border-border border rounded-2xl shadow">
        <div className="flex flex-wrap gap-2 ">
          {heroJourneyTabs.map((tab) => {
            const href = `/${locale}${tab.href}`;
            const isActive = pathname === href;

            return (
              <Link
                key={tab.key}
                href={href}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30 hover:text-primary"
                }`}
              >
                {t(tab.key)}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {actions ? (
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
