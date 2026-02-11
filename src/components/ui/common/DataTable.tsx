// FILE: src/components/common/DataTable.tsx

import { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// Highlight Text Component
interface HighlightTextProps {
  text: string;
  highlight: string;
}

function HighlightText({ text, highlight }: HighlightTextProps) {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 text-gray-900 font-medium px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean; // New: Enable search highlighting for this column
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  itemsPerPage?: number;
  showPagination?: boolean;
  searchQuery?: string; // New: Search query for highlighting
}

type SortDirection = "asc" | "desc" | null;

export default function DataTable<T extends { [key: string]: unknown }>({
  columns,
  data,
  onRowClick,
  itemsPerPage = 10,
  showPagination = true,
  searchQuery = "", // New: Default empty search
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(columnKey);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;

    const aValue = a[sortKey];
    const bValue = b[sortKey];

    // Handle null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Handle different types
    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    // Handle dates
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === "asc"
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    // Try to parse as dates
    const aDate = new Date(String(aValue));
    const bDate = new Date(String(bValue));
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return sortDirection === "asc"
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }

    // Default string comparison
    return sortDirection === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return (
        <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
      );
    }
    if (sortDirection === "asc") {
      return (
        <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-[#036b80] shrink-0" />
      );
    }
    return (
      <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-[#036b80] shrink-0" />
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = showPagination
    ? sortedData.slice(startIndex, endIndex)
    : sortedData;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider ${
                    column.sortable !== false
                      ? "cursor-pointer select-none"
                      : ""
                  }`}
                  onClick={() =>
                    column.sortable !== false && handleSort(column.key)
                  }
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="truncate">{column.label}</span>
                    {column.sortable !== false && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 text-center text-gray-500 text-sm"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(row)}
                  className={`${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""} transition-colors`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900"
                    >
                      {column.render ? (
                        column.render(row[column.key], row)
                      ) : column.searchable && searchQuery ? (
                        <HighlightText
                          text={String(row[column.key] || "")}
                          highlight={searchQuery}
                        />
                      ) : (
                        String(row[column.key] || "")
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && sortedData.length > 0 && (
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Left side - Items per page and info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-gray-600 shrink-0">
                Show:
              </label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 sm:px-3 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent min-h-[40px]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, sortedData.length)} of {sortedData.length}{" "}
              entries
            </div>
          </div>

          {/* Right side - Page navigation */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
            {/* First page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 min-h-[36px] min-w-[36px]"
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 min-h-[36px] min-w-[36px]"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() =>
                    typeof page === "number" && handlePageChange(page)
                  }
                  disabled={page === "..."}
                  className={`min-w-[36px] sm:min-w-[40px] px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    page === currentPage
                      ? "bg-[#036b80] text-white"
                      : page === "..."
                        ? "cursor-default"
                        : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next page */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 min-h-[36px] min-w-[36px]"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 min-h-[36px] min-w-[36px]"
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
