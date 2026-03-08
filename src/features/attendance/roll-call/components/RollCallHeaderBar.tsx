"use client";

import { useTranslations } from "next-intl";
import { Save, Send, RotateCcw, Download, CheckCircle } from "lucide-react";
import Button from "@/components/ui/button/Button";

interface RollCallHeaderBarProps {
  isDirty: boolean;
  isReadOnly: boolean;
  isSubmitted: boolean;
  canSubmit: boolean;
  onSave: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onExport: () => void;
  onMarkAllPresent: () => void;
  onClearAll: () => void;
  isSaving?: boolean;
}

export default function RollCallHeaderBar({
  isDirty,
  isReadOnly,
  isSubmitted,
  canSubmit,
  onSave,
  onSubmit,
  onReset,
  onExport,
  onMarkAllPresent,
  onClearAll,
  isSaving = false,
}: RollCallHeaderBarProps) {
  const t = useTranslations("attendance.rollCall.actions");

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Bulk Actions */}
        <div className="flex items-center gap-2">
          {!isReadOnly && !isSubmitted && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAllPresent}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                {t("markAllPresent")}
              </Button>
              <Button variant="outline" size="sm" onClick={onClearAll}>
                {t("clearAll")}
              </Button>
            </>
          )}
        </div>

        {/* Right: Save/Submit/Export Actions */}
        <div className="flex items-center gap-2">
          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t("export")}
          </Button>

          {!isReadOnly && !isSubmitted && (
            <>
              {/* Reset */}
              {isDirty && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  {t("reset")}
                </Button>
              )}

              {/* Save */}
              <Button
                variant="secondary"
                size="sm"
                onClick={onSave}
                disabled={!isDirty || isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSaving ? t("saving") : t("save")}
              </Button>

              {/* Submit */}
              <Button
                variant="primary"
                size="sm"
                onClick={onSubmit}
                disabled={!canSubmit || isSaving}
                leftIcon={<Send className="w-4 h-4" />}
              >
                {t("submit")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
