"use client";

import { useTranslations } from "next-intl";
import ComingSoon from "@/components/common/ComingSoon";

export default function ExcusesPage() {
  const t = useTranslations("attendance");

  return (
    <ComingSoon
      title={t("excuses")}
      description={t("excusesDesc")}
    />
  );
}
