"use client";

import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import {
  useAttendanceTermContext,
  type AttendanceTermContext,
} from "@/features/attendance/shared/hooks/useAttendanceTermContext";

const AttendanceYearTermLayoutContext =
  createContext<AttendanceTermContext | null>(null);

export function AttendanceYearTermLayoutProvider({
  children,
}: PropsWithChildren) {
  // Workspace-style attendance pages keep one visible section ContextBar
  // in the shared layout, so they can reuse the existing controller here.
  const value = useAttendanceTermContext();

  return (
    <AttendanceYearTermLayoutContext.Provider value={value}>
      {children}
    </AttendanceYearTermLayoutContext.Provider>
  );
}

export function useAttendanceYearTermLayoutContext() {
  const context = useContext(AttendanceYearTermLayoutContext);

  if (!context) {
    throw new Error(
      "useAttendanceYearTermLayoutContext must be used within AttendanceYearTermLayoutProvider"
    );
  }

  return context;
}
