"use client";

import { useTranslations } from "next-intl";
import ComingSoon from "@/components/common/ComingSoon";

export default function RollCallPage() {
  const t = useTranslations("attendance");

  return (
    <ComingSoon
      title={t("rollCall")}
      description={t("rollCallDesc")}
    />
  );
}
