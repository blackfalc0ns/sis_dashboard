"use client";

import {
  Apple,
  BookOpen,
  Download,
  GraduationCap,
  HeartHandshake,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import {
  APP_DOWNLOAD_CONFIG,
  type AppDownloadAudience,
} from "@/features/app-download/utils/appDownloadAudience";

const audienceIcons = {
  student: GraduationCap,
  teacher: BookOpen,
  parent: HeartHandshake,
  dismissalStaff: ShieldCheck,
};

export function AppDownloadScreen({
  audience,
}: {
  audience: AppDownloadAudience;
}) {
  const t = useTranslations("app_download");
  const locale = useLocale();
  const { logout } = useAuth();
  const config = APP_DOWNLOAD_CONFIG[audience];
  const AudienceIcon = audienceIcons[audience];
  const appName = t(config.translationKey);

  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="grid min-h-screen place-items-center bg-gradient-to-br from-sky-50 via-white to-violet-100 px-4 py-8"
    >
      <section
        aria-labelledby="app-download-title"
        className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/90 p-8 text-center shadow-2xl backdrop-blur sm:p-12"
      >
        <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg">
          <AudienceIcon aria-hidden="true" className="size-10" />
        </div>
        <p className="mt-7 text-sm font-semibold text-primary">{t("eyebrow")}</p>
        <h1 id="app-download-title" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {t("title", { appName })}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{t("description", { appName })}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <StoreLink href={config.androidUrl} label={t("android")} icon={<Download aria-hidden="true" className="size-5" />} />
          <StoreLink href={config.iosUrl} label={t("ios")} icon={<Apple aria-hidden="true" className="size-5" />} />
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {t("logout")}
        </button>
      </section>
    </main>
  );
}

function StoreLink({ href, label, icon }: { href: string | null; label: string; icon: React.ReactNode }) {
  const className = "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

  if (!href) {
    return <button type="button" disabled className={`${className} cursor-not-allowed opacity-50`}>{icon}{label}</button>;
  }

  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{icon}{label}</a>;
}
