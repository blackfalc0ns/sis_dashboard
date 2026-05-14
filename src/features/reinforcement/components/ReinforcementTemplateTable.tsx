"use client";

import { Award, ClipboardList } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReinforcementTemplate } from "../types";

interface ReinforcementTemplateTableProps {
  templates: ReinforcementTemplate[];
  loading?: boolean;
  search?: string;
}

const formatRewardValue = (value: unknown): string => {
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (typeof value === "string" && value.trim() !== "") return value;
  return "-";
};

export default function ReinforcementTemplateTable({
  templates,
  loading = false,
  search = "",
}: ReinforcementTemplateTableProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const isRTL = locale === "ar";

  if (loading && templates.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
        {t("common.loading")}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
        <ClipboardList className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-3 text-sm font-medium text-gray-900">
          {t("emptyStates.templates")}
        </p>
        {search ? (
          <p className="mt-1 text-sm text-gray-500">
            {t("templates.noSearchResults")}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500">
                {t("templates.table.template")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500">
                {t("templates.table.source")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500">
                {t("templates.table.reward")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500">
                {t("templates.table.stages")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500">
                {t("templates.table.createdAt")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50">
                <td className="max-w-sm px-4 py-4">
                  <div className="font-semibold text-gray-900">
                    {locale === "ar"
                      ? template.nameAr || template.nameEn
                      : template.nameEn || template.nameAr}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {locale === "ar"
                      ? template.descriptionAr || template.descriptionEn
                      : template.descriptionEn || template.descriptionAr}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">
                  {t(`source.${template.source}`)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Award className="h-4 w-4 text-primary" />
                    <span>{t(`rewardType.${template.reward?.type || 'xp'}`)}</span>
                    <span className="text-gray-400">/</span>
                    <span>{formatRewardValue(template.reward?.value)}</span>
                  </div>
                  {(template.reward?.labelEn || template.reward?.labelAr) && (
                    <div className="mt-1 text-xs text-gray-500">
                      {locale === "ar"
                        ? template.reward.labelAr || template.reward.labelEn
                        : template.reward.labelEn || template.reward.labelAr}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">
                  {t("templates.stageCount", {
                    count: template.stages?.length || 0,
                  })}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {template.createdAt
                    ? new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(template.createdAt))
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 lg:hidden" dir={isRTL ? "rtl" : "ltr"}>
        {templates.map((template) => (
          <article
            key={template.id}
            className="rounded-lg border border-gray-100 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">
                  {locale === "ar"
                    ? template.nameAr || template.nameEn
                    : template.nameEn || template.nameAr}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {locale === "ar"
                    ? template.descriptionAr || template.descriptionEn
                    : template.descriptionEn || template.descriptionAr}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {template.stages?.length || 0}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full bg-gray-100 px-2.5 py-1">
                {t(`source.${template.source}`)}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1">
                {t(`rewardType.${template.reward?.type || 'xp'}`)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
