"use client";

import { ReactNode } from "react";
import { useLocale } from "next-intl";

export interface MatrixColumn {
  id: string;
  label: string;
  code?: string;
  minWidth?: string;
  maxWidth?: string;
}

export interface MatrixRow {
  id: string;
  label: string;
  secondaryLabel?: string;
}

interface AllocationMatrixTableProps<TRow extends MatrixRow, TColumn extends MatrixColumn> {
  rows: TRow[];
  columns: TColumn[];
  rowHeaderLabel: string;
  totalColumnLabel?: string;
  renderCell: (row: TRow, column: TColumn) => ReactNode;
  renderColumnHeader?: (column: TColumn) => ReactNode;
  getRowTotal?: (row: TRow) => number;
  renderRowTotal?: (row: TRow) => ReactNode;
  isEvenRow?: (index: number) => boolean;
  className?: string;
}

export default function AllocationMatrixTable<
  TRow extends MatrixRow,
  TColumn extends MatrixColumn
>({
  rows,
  columns,
  rowHeaderLabel,
  totalColumnLabel,
  renderCell,
  renderColumnHeader,
  getRowTotal,
  renderRowTotal,
  isEvenRow = (index) => index % 2 === 0,
  className = "",
}: AllocationMatrixTableProps<TRow, TColumn>) {
  const locale = useLocale();
  const isRTL = locale === "ar";

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table
        className="min-w-full border-collapse shadow-sm rounded-lg overflow-hidden"
        style={{ backgroundColor: "var(--background)" }}
      >
        <thead>
          <tr>
            {/* Row Header Column - Pinned */}
            <th
              className={`sticky ${
                isRTL ? "right-0" : "left-0"
              } z-20 px-4 py-3 text-${
                isRTL ? "right" : "left"
              } text-xs font-bold uppercase tracking-wider shadow-sm`}
              style={{
                minWidth: "200px",
                backgroundColor: "var(--color-primary-100)",
                borderBottom: "2px solid var(--color-primary-200)",
                color: "var(--color-primary-900)",
              }}
            >
              {rowHeaderLabel}
            </th>

            {/* Column Headers */}
            {columns.map((column) => (
              <th
                key={column.id}
                className={`px-3 py-3 ${
                  isRTL ? "text-right" : "text-left"
                } text-xs font-bold uppercase tracking-wider`}
                style={{
                  minWidth: column.minWidth || "160px",
                  maxWidth: column.maxWidth || "160px",
                  backgroundColor: "var(--color-primary-100)",
                  borderBottom: "2px solid var(--color-primary-200)",
                  color: "var(--color-primary-900)",
                }}
                title={`${column.label}${column.code ? ` (${column.code})` : ""}`}
              >
                {renderColumnHeader ? (
                  renderColumnHeader(column)
                ) : (
                  <div className="flex flex-col gap-1">
                    <div
                      className="font-bold truncate"
                      style={{ color: "var(--color-primary-900)" }}
                    >
                      {column.label}
                    </div>
                    {column.code && (
                      <div className="inline-flex">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: "var(--color-primary-50)",
                            color: "var(--color-primary-700)",
                            border: "1px solid var(--color-primary-200)",
                          }}
                        >
                          {column.code}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </th>
            ))}

            {/* Total Column Header - Pinned (if enabled) */}
            {totalColumnLabel && (
              <th
                className={`sticky ${
                  isRTL ? "left-0" : "right-0"
                } z-20 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider shadow-sm`}
                style={{
                  minWidth: "110px",
                  backgroundColor: "var(--color-primary-50)",
                  borderBottom: "2px solid var(--color-primary-200)",
                  color: "var(--color-primary-900)",
                }}
              >
                {totalColumnLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const isEven = isEvenRow(rowIndex);

            return (
              <tr
                key={row.id}
                className="transition-colors"
                style={{
                  backgroundColor: isEven
                    ? "var(--background)"
                    : "var(--color-gray-50)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-primary-50)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isEven
                    ? "var(--background)"
                    : "var(--color-gray-50)";
                }}
              >
                {/* Row Header Cell - Pinned */}
                <td
                  className={`sticky ${
                    isRTL ? "right-0" : "left-0"
                  } z-10 px-4 py-3 text-sm shadow-sm`}
                  style={{
                    backgroundColor: "inherit",
                    borderBottom: "1px solid var(--color-primary-100)",
                    color: "var(--color-primary-900)",
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="font-semibold">{row.label}</div>
                    {row.secondaryLabel && (
                      <div
                        className="text-xs"
                        style={{ color: "var(--color-primary-600)" }}
                      >
                        {row.secondaryLabel}
                      </div>
                    )}
                  </div>
                </td>

                {/* Data Cells */}
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className="p-0"
                    style={{ borderBottom: "1px solid var(--color-primary-100)" }}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}

                {/* Total Cell - Pinned (if enabled) */}
                {totalColumnLabel && (
                  <td
                    className={`sticky ${
                      isRTL ? "left-0" : "right-0"
                    } z-10 px-4 py-3 text-sm font-bold text-center shadow-sm`}
                    style={{
                      backgroundColor: "var(--color-primary-50)",
                      borderBottom: "2px solid var(--color-primary-200)",
                      color: "var(--color-primary-900)",
                    }}
                  >
                    {renderRowTotal ? renderRowTotal(row) : (getRowTotal ? getRowTotal(row) : null)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Hide number input spinners */}
      <style jsx>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
