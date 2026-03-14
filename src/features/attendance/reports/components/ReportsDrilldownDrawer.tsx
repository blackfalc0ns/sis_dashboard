"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";

export interface ReportsDrilldownColumn {
  key: string;
  label: string;
}

export interface ReportsDrilldownState {
  title: string;
  description?: string;
  columns: ReportsDrilldownColumn[];
  rows: Array<Record<string, string | number>>;
  route?: "absences" | "lateEarly" | "excuses";
}

interface ReportsDrilldownDrawerProps {
  state: ReportsDrilldownState | null;
  open: boolean;
  onClose: () => void;
  onOpenRoute: (route: "absences" | "lateEarly" | "excuses") => void;
}

export default function ReportsDrilldownDrawer({
  state,
  open,
  onClose,
  onOpenRoute,
}: ReportsDrilldownDrawerProps) {
  const t = useTranslations("attendance.reportsPage.drilldown");
  const route = state?.route;

  return (
    <AttendanceBottomDrawer isOpen={open} onClose={onClose} heightClassName="h-[85vh]">
      <div className="h-full flex flex-col p-4 gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {state?.title || t("title")}
            </div>
            {state?.description ? (
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                {state.description}
              </div>
            ) : null}
          </div>
          {route ? (
            <Button variant="outline" size="sm" onClick={() => onOpenRoute(route)}>
              {t(`openIn.${route}`)}
            </Button>
          ) : null}
        </div>

        <div className="flex-1 overflow-auto rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
          {state && state.rows.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ color: "var(--text-secondary)" }}>
                  {state.columns.map((column) => (
                    <th key={column.key} className="px-4 py-3 text-start">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.rows.map((row, index) => (
                  <tr key={index} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                    {state.columns.map((column) => (
                      <td key={column.key} className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                        {row[column.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: "var(--text-secondary)" }}>
              {t("empty")}
            </div>
          )}
        </div>
      </div>
    </AttendanceBottomDrawer>
  );
}
