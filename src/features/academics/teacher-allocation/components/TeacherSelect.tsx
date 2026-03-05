"use client";

import { useTranslations, useLocale } from "next-intl";
import { 
  Select, 
  MenuItem, 
  TextField, 
  Chip, 
  ListSubheader,
  SelectChangeEvent 
} from "@mui/material";
import { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { normalizeSearchText, buildSearchText } from "@/utils/text/normalizeSearch";
import { useMemo, useState, useRef, useEffect } from "react";

/**
 * Teacher selection dropdown with bilingual search support
 * Used in Teacher Allocation (Tab 7) for assigning teachers to subjects
 * 
 * UI Design:
 * - Closed state: Normal Select dropdown (no search visible)
 * - Open state: Search TextField appears as first item inside menu
 * - List scrolls under the sticky search input
 * 
 * Features:
 * - Searches both Arabic and English names regardless of UI language
 * - Shows teacher load and max capacity
 * - Highlights overloaded teachers
 */

interface TeacherSelectProps {
  teachers: Teacher[];
  value: string | null;
  onChange: (teacherId: string | null) => void;
  disabled?: boolean;
  teacherLoads?: Map<string, number>; // teacherId -> weekly hours
  placeholder?: string;
  size?: "small" | "medium";
}

// Extended teacher option with searchable text
interface TeacherOption extends Teacher {
  searchText: string;
}

export default function TeacherSelect({
  teachers,
  value,
  onChange,
  disabled = false,
  teacherLoads,
  placeholder,
  size = "small",
}: TeacherSelectProps) {
  const t = useTranslations("academics.teacherAllocation.matrix");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getTeacherLabel = (teacher: Teacher) => {
    return locale === "ar"
      ? (teacher.nameAr || teacher.nameEn)
      : (teacher.nameEn || teacher.nameAr);
  };

  // Build teacher options with searchable text
  const teacherOptions: TeacherOption[] = useMemo(() => {
    return teachers.map((teacher) => {
      const label = locale === "ar"
        ? (teacher.nameAr || teacher.nameEn)
        : (teacher.nameEn || teacher.nameAr);
      
      return {
        ...teacher,
        searchText: buildSearchText(
          teacher.nameAr,
          teacher.nameEn,
          label
        ),
      };
    });
  }, [teachers, locale]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return teacherOptions;
    
    const normalizedQuery = normalizeSearchText(searchQuery);
    return teacherOptions.filter((option) => {
      const normalizedOption = normalizeSearchText(option.searchText);
      return normalizedOption.includes(normalizedQuery);
    });
  }, [teacherOptions, searchQuery]);

  const getTeacherLoad = (teacherId: string): number => {
    return teacherLoads?.get(teacherId) || 0;
  };

  // Auto-focus search input when menu opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure menu is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value;
    onChange(newValue || null);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Clear search when menu closes
    setSearchQuery("");
  };

  return (
    <Select
      value={value || ""}
      onChange={handleChange}
      onOpen={handleOpen}
      onClose={handleClose}
      disabled={disabled}
      size={size}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return (
            <span style={{ color: "var(--color-gray-400, #9ca3af)" }}>
              {placeholder || t("selectTeacher")}
            </span>
          );
        }
        const teacher = teacherOptions.find((t) => t.id === selected);
        return teacher ? getTeacherLabel(teacher) : "";
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            mt: 1,
            maxHeight: 320,
            borderRadius: 3,
            border: "2px solid var(--color-primary, #006D82)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          },
        },
        MenuListProps: {
          sx: {
            paddingTop: 0,
          },
        },
      }}
      sx={{
        minWidth: 200,
        backgroundColor: disabled ? "var(--color-gray-100, #f3f4f6)" : "white",
        fontFamily: "inherit",
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--color-primary, #006D82)",
          borderWidth: "2px",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: disabled
            ? "var(--color-primary, #006D82)"
            : "var(--color-primary-700, #005566)",
          borderWidth: "2px",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--color-primary, #006D82)",
          borderWidth: "2px",
        },
      }}
    >
      {/* Sticky search input at top of menu */}
      <ListSubheader
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          backgroundColor: "white",
          paddingTop: 1.5,
          paddingBottom: 1,
          paddingX: 2,
        }}
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <TextField
          inputRef={searchInputRef}
          size="small"
          fullWidth
          placeholder={t("searchTeacher")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "white",
            },
          }}
        />
      </ListSubheader>

      {/* Teacher options */}
      {filteredOptions.length > 0 ? (
        filteredOptions.map((option) => {
          const load = getTeacherLoad(option.id);
          const maxLoad = option.maxWeeklyLoad;
          const isOverloaded = maxLoad && load > maxLoad;

          return (
            <MenuItem key={option.id} value={option.id}>
              <div className="flex items-center justify-between w-full gap-2">
                <span className="flex-1">{getTeacherLabel(option)}</span>
                <div className="flex items-center gap-2">
                  {teacherLoads && (
                    <Chip
                      label={t("currentLoad", { periods: load })}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.75rem",
                        backgroundColor: isOverloaded
                          ? "var(--color-accent-100, #fef3c7)"
                          : "var(--color-gray-100, #f3f4f6)",
                        color: isOverloaded
                          ? "var(--color-accent-700, #b45309)"
                          : "var(--color-gray-700, #374151)",
                      }}
                    />
                  )}
                  {maxLoad && (
                    <span className="text-xs text-gray-500">/ {maxLoad}</span>
                  )}
                </div>
              </div>
            </MenuItem>
          );
        })
      ) : (
        <MenuItem disabled>
          <span style={{ color: "var(--color-gray-400, #9ca3af)" }}>
            {tCommon("noResults")}
          </span>
        </MenuItem>
      )}
    </Select>
  );
}
