"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

interface AccessDeniedProps {
  className?: string;
  description?: string;
  title?: string;
}

export function AccessDenied({
  className = "",
  description,
  title,
}: AccessDeniedProps) {
  const t = useTranslations("common.accessDenied");

  return (
    <div
      className={[
        "rounded-2xl border border-amber-200 bg-amber-50 p-6 mt-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-amber-900">
            {title ?? t("title")}
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            {description ?? t("description")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;
