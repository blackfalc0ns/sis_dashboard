"use client";

import { useTranslations, useLocale } from "next-intl";
import { Autocomplete, TextField, Chip } from "@mui/material";
import { Teacher } from "@/services/academics/teacherAllocationService";

interface TeacherSelectProps {
  teachers: Teacher[];
  value: string | null;
  onChange: (teacherId: string | null) => void;
  disabled?: boolean;
  teacherLoads?: Map<string, number>; // teacherId -> weekly hours
  placeholder?: string;
  size?: "small" | "medium";
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
  const tActions = useTranslations("academics.teacherAllocation.actions");
  const locale = useLocale();

  const selectedTeacher = teachers.find((t) => t.id === value) || null;

  const getTeacherLabel = (teacher: Teacher) => {
    return locale === "ar"
      ? (teacher.nameAr || teacher.nameEn)
      : (teacher.nameEn || teacher.nameAr);
  };

  const getTeacherLoad = (teacherId: string): number => {
    return teacherLoads?.get(teacherId) || 0;
  };

  return (
    <Autocomplete
      size={size}
      value={selectedTeacher}
      onChange={(_, newValue) => {
        onChange(newValue?.id || null);
      }}
      options={teachers}
      getOptionLabel={(option) => getTeacherLabel(option)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder || t("selectTeacher")}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: disabled ? "var(--color-gray-100, #f3f4f6)" : "white",
              "& fieldset": {
                borderColor: "var(--color-border, #e5e7eb)",
              },
              "&:hover fieldset": {
                borderColor: disabled ? "var(--color-border, #e5e7eb)" : "var(--color-primary, #006D82)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--color-primary, #006D82)",
              },
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        const load = getTeacherLoad(option.id);
        const maxLoad = option.maxWeeklyLoad;
        const isOverloaded = maxLoad && load > maxLoad;

        return (
          <li {...props} key={option.id}>
            <div className="flex items-center justify-between w-full">
              <span className="flex-1">{getTeacherLabel(option)}</span>
              <div className="flex items-center gap-2">
                {teacherLoads && (
                  <Chip
                    label={t("currentLoad", { hours: load })}
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
                  <span className="text-xs text-gray-500">
                    / {maxLoad}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      }}
      noOptionsText={t("noTeacher")}
      clearText={tActions("clearSelection")}
      sx={{
        minWidth: 200,
        "& .MuiAutocomplete-clearIndicator": {
          color: "var(--color-gray-500, #6b7280)",
        },
      }}
    />
  );
}
