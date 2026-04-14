"use client";

import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import {
  useAcademicYearTermContext,
  type UseAcademicYearTermContextOptions,
  type UseAcademicYearTermContextResult,
} from "@/features/academics/hooks/useAcademicYearTermContext";

const AcademicYearTermLayoutContext =
  createContext<UseAcademicYearTermContextResult | null>(null);

interface AcademicYearTermLayoutProviderProps
  extends PropsWithChildren {
  options?: UseAcademicYearTermContextOptions;
}

export function AcademicYearTermLayoutProvider({
  children,
  options,
}: AcademicYearTermLayoutProviderProps) {
  const value = useAcademicYearTermContext(options);

  return (
    <AcademicYearTermLayoutContext.Provider value={value}>
      {children}
    </AcademicYearTermLayoutContext.Provider>
  );
}

export function useAcademicYearTermLayoutContext() {
  const context = useContext(AcademicYearTermLayoutContext);

  if (!context) {
    throw new Error(
      "useAcademicYearTermLayoutContext must be used within AcademicYearTermLayoutProvider"
    );
  }

  return context;
}
