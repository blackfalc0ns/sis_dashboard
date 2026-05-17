"use client";

import { useEffect, useMemo, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import type { CommunicationSelectorOption } from "@/features/communication/api/communication-selectors.service";

export interface CommunicationEntitySelectProps {
  label: string;
  value?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  clearable?: boolean;
  search: (query: string) => Promise<CommunicationSelectorOption[]>;
  onChange: (value: string) => void;
}

export default function CommunicationEntitySelect({
  clearable = true,
  disabled,
  error,
  helperText,
  label,
  onChange,
  placeholder,
  search,
  value,
}: CommunicationEntitySelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<CommunicationSelectorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    if (disabled) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      search(inputValue)
        .then((items) => {
          if (!cancelled) setOptions(items);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [disabled, inputValue, search]);

  return (
    <Autocomplete
      disabled={disabled}
      options={options}
      value={selectedOption}
      inputValue={inputValue}
      loading={isLoading}
      clearOnBlur={false}
      disableClearable={!clearable}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      noOptionsText={isLoading ? "Loading..." : "No options"}
      onInputChange={(_, nextInput) => setInputValue(nextInput)}
      onChange={(_, option) => onChange(option?.id ?? "")}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={Boolean(error)}
          helperText={error ?? helperText}
          size="small"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <div>
            <div className="text-sm font-medium">{option.label}</div>
            {option.description ? (
              <div className="text-xs text-slate-500">{option.description}</div>
            ) : null}
          </div>
        </li>
      )}
    />
  );
}
