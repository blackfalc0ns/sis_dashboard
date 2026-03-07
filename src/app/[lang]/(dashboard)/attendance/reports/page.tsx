"use client";

import { useTranslations } from "next-intl";
import ComingSoon from "@/components/common/ComingSoon";

export default function ReportsPage() {
  const t = useTranslations("attendance");

  return (
    <ComingSoon
      title={t("reports")}
      description={t("reportsDesc")}
    />
  );
}
