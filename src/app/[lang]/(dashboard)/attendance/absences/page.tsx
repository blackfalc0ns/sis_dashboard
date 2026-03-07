"use client";

import { useTranslations } from "next-intl";
import ComingSoon from "@/components/common/ComingSoon";

export default function AbsencesPage() {
  const t = useTranslations("attendance");

  return (
    <ComingSoon
      title={t("absences")}
      description={t("absencesDesc")}
    />
  );
}
