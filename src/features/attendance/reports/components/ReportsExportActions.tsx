"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import Button from "@/components/ui/button/Button";

interface ReportsExportActionsProps {
  onOpenExport: () => void;
  disabled?: boolean;
}

export default function ReportsExportActions({
  onOpenExport,
  disabled = false,
}: ReportsExportActionsProps) {
  const t = useTranslations("attendance.reportsPage.export");

  return (
    <Button
      variant="outline"
      onClick={onOpenExport}
      disabled={disabled}
      leftIcon={<Download className="w-4 h-4" />}
    >
      {t("button")}
    </Button>
  );
}
