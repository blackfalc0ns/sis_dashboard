"use client";

import { useCallback, useEffect, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import {
  searchUsers,
  type CommunicationSelectorOption,
} from "@/features/communication/api/communication-selectors.service";

export interface UserMultiSearchSelectProps {
  label: string;
  value: string[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string[]) => void;
}

export default function UserMultiSearchSelect({
  disabled,
  error,
  helperText,
  label,
  onChange,
  placeholder,
  value,
}: UserMultiSearchSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<CommunicationSelectorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const selectedOptions = options.filter((option) => value.includes(option.id));
  const loadUsers = useCallback((query: string) => searchUsers(query), []);

  useEffect(() => {
    if (disabled) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      loadUsers(inputValue)
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
  }, [disabled, inputValue, loadUsers]);

  return (
    <Autocomplete
      multiple
      disabled={disabled}
      options={options}
      value={selectedOptions}
      inputValue={inputValue}
      loading={isLoading}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      onInputChange={(_, nextInput) => setInputValue(nextInput)}
      onChange={(_, nextOptions) => onChange(nextOptions.map((option) => option.id))}
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
    />
  );
}
