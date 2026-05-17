import type { ReactNode } from "react";
import { Breadcrumbs, Typography } from "@mui/material";

export interface CommunicationBreadcrumbItem {
  label: ReactNode;
  href?: string;
}

export interface CommunicationPageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: CommunicationBreadcrumbItem[];
}

export default function CommunicationPageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: CommunicationPageHeaderProps) {
  return (
    <header className="space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs aria-label="Communication breadcrumbs">
          {breadcrumbs.map((item, index) =>
            item.href ? (
              <a
                key={`${item.href}-${index}`}
                href={item.href}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-700"
              >
                {item.label}
              </a>
            ) : (
              <Typography
                key={`breadcrumb-current-${index}`}
                component="span"
                className="text-sm font-medium text-slate-900"
              >
                {item.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      ) : null}

      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
