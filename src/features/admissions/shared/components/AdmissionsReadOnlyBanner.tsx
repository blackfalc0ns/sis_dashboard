"use client";

import { useTranslations } from "next-intl";

export default function AdmissionsReadOnlyBanner() {
  const t = useTranslations("admissions.context_bar");

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {t("read_only_banner")}
    </div>
  );
}
