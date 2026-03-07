"use client";

import { useTranslations } from "next-intl";
import ComingSoon from "@/components/common/ComingSoon";

export default function LateEarlyPage() {
  const t = useTranslations("attendance");

  return (
    <ComingSoon
      title={t("lateEarly")}
      description={t("lateEarlyDesc")}
    />
  );
}
